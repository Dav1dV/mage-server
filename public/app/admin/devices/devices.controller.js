angular
  .module('mage')
  .controller('AdminDevicesController', AdminDevicesController);

AdminDevicesController.$inject = ['$scope', '$uibModal', '$filter', '$location', 'LocalStorageService', 'DeviceService', 'UserService'];

function AdminDevicesController($scope, $uibModal, $filter, $location, LocalStorageService, DeviceService, UserService) {
  $scope.token = LocalStorageService.getToken();
  $scope.filter = "all"; // possible values all, registered, unregistered
  $scope.devices = [];
  $scope.page = 0;
  $scope.itemsPerPage = 10;

  DeviceService.getAllDevices().success(function (devices) {
    $scope.devices = devices;
  });

  UserService.getAllUsers().success(function (users) {
    $scope.users = users;
  });

  $scope.$watch('devices', function(devices) {
    $scope.filteredDevices = devices;
  });

  $scope.userIdMap = {};
  $scope.$watch('users', function(users) {
    $scope.userIdMap = _.indexBy(users, 'id');
  });

  $scope.filterDevices = function(device) {
    var filteredDevices = $filter('filter')([device], $scope.deviceSearch);
    if (filteredDevices && filteredDevices.length) return true;

    var filteredUsers = $filter('user')($scope.users, ['displayName', 'email'], $scope.deviceSearch);
    return _.some(filteredUsers, function(filteredUser) {
      if (device.userId === filteredUser.id) return true;
    });
  };

  $scope.filterRegistered = function (device) {
    switch ($scope.filter) {
    case 'all': return true;
    case 'registered': return device.registered;
    case 'unregistered': return !device.registered;
    }
  };

  $scope.iconClass = function(device) {
    if (device.iconClass) return device.iconClass;

    var userAgent = device.userAgent || "";

    if (device.appVersion === 'Web Client') {
      device.iconClass = 'fa-desktop admin-desktop-icon';
    } else if (userAgent.toLowerCase().indexOf("android") !== -1) {
      device.iconClass = 'fa-android admin-android-icon';
    } else if(userAgent.toLowerCase().indexOf("ios") !== -1) {
      device.iconClass = 'fa-apple admin-apple-icon';
    } else {
      device.iconClass = 'fa-mobile admin-generic-icon';
    }

    return device.iconClass;
  };

  $scope.reset = function() {
    $scope.page = 0;
    $scope.filter = 'all';
    $scope.deviceSearch = '';
  };

  $scope.newDevice = function() {
    $location.path('/admin/devices/new');
  };

  $scope.gotoDevice = function(device) {
    $location.path('/admin/devices/' + device.id);
  };

  $scope.editDevice = function($event, device) {
    $event.stopPropagation();

    $location.path('/admin/devices/' + device.id + '/edit');
  };

  $scope.deleteDevice = function($event, device) {
    $event.stopPropagation();

    var modalInstance = $uibModal.open({
      templateUrl: '/app/admin/devices/device-delete.html',
      resolve: {
        device: function () {
          return device;
        }
      },
      controller: ['$scope', '$uibModalInstance', 'device', function ($scope, $uibModalInstance, device) {
        $scope.device = device;

        $scope.deleteDevice = function(device) {
          DeviceService.deleteDevice(device).success(function() {
            $uibModalInstance.close(device);
          });
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      }]
    });

    modalInstance.result.then(function(device) {
      $scope.devices = _.reject($scope.devices, function(d) { return d.id === device.id; });
    });
  };

  $scope.registerDevice = function ($event, device) {
    $event.stopPropagation();

    device.registered = true;
    DeviceService.updateDevice(device).success(function(data) {
      angular.copy(data, device);
      $scope.saved = true;
    }, function(response) {
      $scope.error = response.responseText;
    });
  };
}
