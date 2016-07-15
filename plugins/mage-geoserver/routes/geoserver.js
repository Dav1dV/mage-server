var path = require('path')
  , util = require('util')
  , querystring = require('querystring')
  , xmlbuilder = require('xmlbuilder')
  , api = require('../../../api')
  , sldBuilder = require('../sld')
  , config = require('../config.json');

function GeoServerResource() {}

module.exports = function(app, authentication) {

  var passport = authentication.passport;
  var resource = new GeoServerResource(passport);

  app.get(
    '/sld',
    passport.authenticate('geoserver-bearer', { session: false }),
    resource.sld
  );

  app.get('/icons/observation/:eventId/(:type)?/(:variant)?.svg',
    passport.authenticate('geoserver-bearer', { session: false }),
    resource.getObservationSvg
  );

  app.get(
    '/icons/observation/:eventId/:type?/:variant?',
    passport.authenticate('geoserver-bearer', { session: false }),
    resource.getObservationIcon
  );

  app.get(
    '/icons/users/(:userId)?.svg',
    passport.authenticate('geoserver-bearer', { session: false }),
    resource.getUserSvg
  );

  app.get(
    '/icons/users/:userId/',
    passport.authenticate('geoserver-bearer', { session: false }),
    resource.getUserIcon
  );

};

GeoServerResource.prototype.sld = function(req, res, next) {
  var layers = req.param('layers');
  if (!layers) return res.sendStatus(400);

  sldBuilder.create(req.getRoot(), layers.split(','), function(err, sld) {
    if (err) return next(err);
    console.log('making an sld', sld);

    res.send(sld);
  });
};

GeoServerResource.prototype.getObservationSvg = function(req, res) {
  var svg = xmlbuilder.create({
    svg: {
      '@xmlns': 'http://www.w3.org/2000/svg',
      '@xmlns:xlink': 'http://www.w3.org/1999/xlink',
      '@width': '42px',
      '@height': '84px',
      image: {
        '@x': 0,
        '@y': 0,
        '@width': '42px',
        '@height': '42px',
        '@xlink:href': util.format('%s/ogc/icons/observation/%s/%s/%s?access_token=%s',
          req.getRoot(),
          querystring.escape(req.params.eventId),
          querystring.escape(req.params.type),
          querystring.escape(req.params.variant),
          config.token)
      }
    }
  }).end();

  res.send(svg);
};

GeoServerResource.prototype.getObservationIcon = function(req, res, next) {
  new api.Icon(req.event._id, req.params.type, req.params.variant).getIcon(function(err, iconPath) {
    if (err || !iconPath) return next();

    res.sendFile(iconPath);
  });
};

GeoServerResource.prototype.getUserSvg = function(req, res) {
  console.log('try to get a user svg');
  var svg = xmlbuilder.create({
    svg: {
      '@xmlns': 'http://www.w3.org/2000/svg',
      '@xmlns:xlink': 'http://www.w3.org/1999/xlink',
      '@width': '42px',
      '@height': '84px',
      image: {
        '@x': 0,
        '@y': 0,
        '@width': '42px',
        '@height': '42px',
        '@xlink:href': util.format('%s/ogc/icons/users/%s?access_token=%s', req.getRoot(), req.params.userId, config.token)
      }
    }
  }).end();

  res.send(svg);
};

GeoServerResource.prototype.getUserIcon = function(req, res, next) {
  console.log('try to get a user icon');

  if (!req.userParam) return res.sendStatus(200);

  new api.User().icon(req.userParam, function(err, icon) {
    if (err) return next(err);

    if (!icon || !icon.relativePath) {
      return res.sendFile(path.resolve(__dirname, './img/blank.png'));
    }

    res.sendFile(icon.path);
  });
};