// Constructor
function Tokenizer(str) {
  this.str = str;
}

// Prototype
Tokenizer.prototype = {
  constructor: Tokenizer,
  takeChars: function (num) {
    if (!num) {
      num = 1;
    }
    var tokens = new Array();
    while (num--) {
      var matches = this.str.match(/^(\S+)\s*/);
      if (matches) {
        this.str = this.str.substr(matches[0].length);
        tokens.push(matches[1]);
      } else {
        tokens.push(false);
      }
    }
    if (1 == tokens.length) {
      return tokens[0];
    } else {
      return tokens;
    }
  },
  takeNumber: function (num) {
    if (!num) {
      num = 1;
    }
    if (1 == num) {
      return Number(this.takeChars());
    } else {
      var tokens = this.takeChars(num);
      while (num--) {
        tokens[num] = Number(tokens[num]);
      }
      return tokens;
    }
  },
  takeString: function () {
    var byteCount = Number(this.takeChars()), charCount = 0, charCode;
    if ('-' != this.str.charAt(0)) {
      return false;
    }
    while (0 < byteCount) {
      ++charCount;
      charCode = this.str.charCodeAt(charCount);
      if (0x80 > charCode) {
        --byteCount;
      } else if (0x800 > charCode) {
        byteCount -= 2;
      } else {
        byteCount -= 3;
      }
    }
    var str = this.str.substr(1, charCount);
    this.str = this.str.substr(1 + charCount).replace(/^\s+/, '');
    return str;
  }
};

// Exports
module.exports = Tokenizer;
