const bcrypt = require("bcrypt");
const crypto = require("crypto");
const async = require("async");
const shortid = require("shortid");
const db = require("../external/db.js");

const config = {
  rounds: 10
};

class User {
  constructor(data) {
    if (typeof data === "undefined") {
      this.data = {
        tokens: [],
        profile: {},
        _id: shortid.generate()
      };

      this._meta = {
        new: true
      };
    } else {
      this.data = data;
      this._data = data;
      this._meta = {
        new: false
      };
    }
  }

  verifyPassword(candidate) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(candidate, this.data.password, (err, matches) => {
        if (err) return reject(err);
        resolve(null, matches);
      });
    });
  }

  password(newPassword = false) {
    if (newPassword !== false) {
      // generate new password, store locally & update db
      return new Promise((resolve, reject) => {
        this.hashPassword(this.data.password)
          .then(hashed => {
            db.users.update({
              _id: this.data._id
            }, err => {
              if (err) {
                return reject(err);
              }
              return resolve(null);
            });
          })
          .catch(e => reject(e));
      });
    }
    // return the hashed password
    return this.data.password;
  }

  hashPassword(password) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(config.rounds, (err, salt) => {
        if (err) return reject(err);

        bcrypt.hash(password, salt, null, (err, hash) => {
          if (err) return reject(err);
          return resolve(hash);
        });
      });
    });
  }

  data(data = -1) {
    if (data !== -1) {
      // can't set full userdata!
      console.error("Cannot set full data!");
    } else {
      return this.data;
    }
  }

  saveUser() {
    const self = this;
    if (this._meta.new) {
      // TODO: check for dupes & stuff
      return new Promise((resolve, reject) => {
        // generating hashed password
        this.hashPassword(this.data.password)
          .then(hash => {
            this.data.password = hash;
            return hash;
          })
          .then(r => {
            // pre-constructing profile
            this.data.profile = {};

            db.users.insert(this.data, (err, inserted) => {
              if (err) {
                console.error(err);
                return reject(err);
              }
              return resolve(new User(inserted));
            });
          })
          .catch(e => reject(e));
      });
    }
    // TODO: refrac
    return new Promise((resolve, reject) => {
      if (this.isModified("password")) {
        this.hashPassword(this.data.password)
          .then(hash => {
            this.data.password = hash;
          })
          .then(r => {
            this.data.password = hash;
            this._data = this.data;
            db.users.update({
              _id: this.data._id
            }, this.data, {}, err => {
              if (err) {
                console.error(err);
                return reject(err);
              }
              return resolve(this);
            });
          })
          .catch(e => reject(e));
      } else {
        this._data = this.data;
        db.users.update({
          _id: this.data._id
        }, this.data, {}, err => {
          if (err) {
            console.error(err);
            return reject(err);
          }
          return resolve(this);
        });
      }
    });
  }

  comparePassword(candidatePassword, cb) {
    console.log("comparing");
    console.log("COMPARING " + candidatePassword);
    console.log("and " + this.data.password);

    bcrypt.compare(candidatePassword, this.data.password, (err, isMatch) => {
      cb(err, isMatch);
    });
  }

  isModified(field) {
    console.log(`${this.data[field]} vs ${this._data[field]}`);
    return this._data[field] !== this.data[field];
  }

  gravatar(size) {
    if (!size) {
      size = 200;
    }
    if (!this.data.email) {
      return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto
      .createHash("md5")
      .update(this.data.email)
      .digest("hex");
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
  }
}

module.exports = User;