function loadFile(url, callback) {
  var request;
  try {
    request = new XMLHttpRequest();
  } catch (e) {
    try {
      request = new ActiveXObject('Msxml2.XMLHTTP');
    }
    catch (e) {
      try {
        request = new ActiveXObject('Microsoft.XMLHTTP');
      }
      catch (e) {}
    }
  }

  if (request) {
    request.onreadystatechange = onreadystatechange;
    request.open('GET', url, true);
    request.send();
  } else {
    callback(new Error('Error creating XMLHTTP instance'));
  }

  function onreadystatechange() {
    if (request.readyState == 4) {
      var err;
      try {
        if (request.status != 200) {
          err = new Error('Error ' + request.status + ' loading the file');
          err.status = request.status;
        }
      }
      catch (e) {
        err = e;
      }
      callback(err, request.responseText);
    }
  }
}

module.exports = loadFile;
