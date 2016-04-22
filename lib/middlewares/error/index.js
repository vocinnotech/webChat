import bunyan from "bunyan";

export default function(app, appName) {
  var log = bunyan.createLogger({name: appName});
  app.on('error', (err, context) => {
    log.error(err);
    ErrorRecorder.recordError(context, log, err);
  });
  app.on('info', (err, context) => {
    log.info(err);
    ErrorRecorder.recordInfo(context, log, err);
  });

  return function *(next) {
    try {
      yield next;
    } catch (err) {
      if (err.status == 501 || err.status == 502) {
        this.status = err.status;
        this.body = err.message;
        this.app.emit('info', err, this);
      } else {
        this.status = err.status || 500;
        this.body = err.message;
        this.app.emit('error', err, this);
      }
    }
  }
}

export class ErrorRecorder {
  static recordInfo(context, log, err) {
    var params = {};
    var url = context.request.url;;
    var method = context.request.method;
    if (context.request.method == 'GET' || context.request.method == 'DELETE') {
      params = context.query;
    } else if (context.request.method == 'POST' || context.request.method == 'PUT'){
      params = context.request.body;
    }
    //if (err.stack) log.info(err.stack);
    var message = "no";
    if (context.request && context.request.user)
      message = JSON.stringify(context.request.user);
    log.info("err type is error! url is " + url + ", method is " + method + ", params is " + JSON.stringify(params) + ", user is " + message + ", header is " + JSON.stringify(context.header));
  }

  static recordError(context, log, err) {
    var params = {};
    var url = context.request.url;;
    var method = context.request.method;
    if (context.request.method == 'GET' || context.request.method == 'DELETE') {
      params = context.query;
    } else if (context.request.method == 'POST' || context.request.method == 'PUT'){
      params = context.request.body;
    }
    //if (err.stack) log.error(err.stack);
    var message = "no";
    if (context.request && context.request.user)
      message = JSON.stringify(context.request.user);
    log.error("err type is info! url is " + url + ", method is " + method + ", params is " + JSON.stringify(params) + ", user is " + message + ", header is " + JSON.stringify(context.header));
  }
}
