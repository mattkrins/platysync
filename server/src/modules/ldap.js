import ldap from "ldapjs";

const ACCOUNTDISABLE = 2
const errorTypes = [
    "error",
    "connectRefused",
    "connectTimeout",
    "connectError",
    "setupError",
    "socketTimeout",
    "resultError",
    "timeout"
]

function strValid(str) { return str != null && str.trim() !== ""  && typeof str === "string" && str.length > 0; }

class User {
    cn;
    dn;
    userAccountControl;
    client = null;
    securityGroups = [];
    memberOf = [];
    attributes = {};
    constructor(user, client = null) {
        if (client) this.bind(client);
        this.setup(user);
    }
    setup = (user = {}) => {
        Object.assign(this, user);
        const self = this;
        Object.keys(user).forEach(function(key) {
            self.attributes[key.toLowerCase()] = user[key];
        });
        this.ou = ouFromDn(this.dn);
        for (let i = 0; i < this.memberOf.length; i++) {
            const dn = this.memberOf[i];
            const name = dnTopName(dn);
            this.securityGroups.push(name);
        }
    };
    bind = (client) => { this.client = client; };
    disabled = () => { return !this.enabled() };
    enabled = () => { return ( (this.userAccountControl & ACCOUNTDISABLE) === 0 ) };
    enable = (disable = false) => {
        const self = this;
        return new Promise(function(resolve, reject) {
            if (!self.dn) reject("User does not exist.");
            if (!self.client) reject("LDAP client not bound to user.")
            if (!disable) if ( self.enabled() ) reject("Already enabled.")
            if (disable) if ( !self.enabled() ) reject("Already disabled.")
            const userAccountControl = disable ?
            (self.userAccountControl | (ACCOUNTDISABLE)) : // Bitwise OR
            (self.userAccountControl &= ~(ACCOUNTDISABLE)); // Bitwise NOT
            const change = new ldap.Change({
              operation: 'replace',
              modification: { userAccountControl }
            });
            self.client.modify(self.dn, change, function(err, res) {
                if (err) { return reject(err) }
                resolve(res);
            });
        })
    }
    disable = () => { return this.enable(true); }
    memberOfGroup = (dn = '', caseSensitive = false) => {
        const search = this.memberOf.filter((group)=> caseSensitive ? group===dn : group.toLowerCase()===dn.toLowerCase() )
        return search.length > 0;
    }
    memberOfGroupName = (name = '') => { return this.securityGroups.includes(name) }
    addToGroup = (dn = '', remove = false) => {
        const self = this;
        return new Promise(function(resolve, reject) {
            if (!self.dn) reject("User does not exist.");
            if (!self.client) reject("LDAP client not bound to user.")
            const change = new ldap.Change({
              operation: remove ? 'delete' : 'add',
              modification: { member: [self.dn] }
            });
            self.client.modify(dn, change, function(err, res) {
                if (err) { return reject(err) }
                resolve(res);
            });
        })
    }
    removeFromGroup = (dn = '') => {
        return this.addToGroup(dn, true);
    }
    move = (toOU = '') => {
        const dn = `cn=${this.cn},${toOU}`;
        return this.modifyDN(dn);
    }
    rename = (cn = '') => {
        const dn = `cn=${cn},${this.ou}`;
        return this.modifyDN(dn);
    }
    modifyDN = (toDN = '') => {
        const self = this;
        return new Promise(function(resolve, reject) {
            if (!self.dn) reject("User does not exist.");
            if (!self.client) reject("LDAP client not bound to user.");
            if (self.dn===toDN) reject("No change to be made.");
            self.client.modifyDN(self.dn, toDN, (err, res) => {
                if (err) { return reject(err) }
                resolve(res);
            });
        })
    }
    delete = () => {
        const self = this;
        return new Promise(function(resolve, reject) {
            if (!self.dn) reject("User does not exist.");
            if (!self.client) reject("LDAP client not bound to user.");
            self.client.del(self.dn, (err, res) => {
                if (err) { return reject(err) }
                self.dn = null;
                resolve(res);
            });
        })
    }
    update = (modification = {}) => {
        const self = this;
        return new Promise(function(resolve, reject) {
            if (!self.dn) reject("User does not exist.");
            if (!self.client) reject("LDAP client not bound to user.")
            const change = new ldap.Change({
              operation: 'replace',
              modification 
            });
            self.client.modify(self.dn, change, function(err, res) {
                if (err) { return reject(err) }
                resolve(res);
            });
        })
    }
    refresh = () => {
        const self = this;
        return new Promise(function(resolve, reject) {
            if (!self.dn) reject("User does not exist.");
            if (!self.client) reject("LDAP client not bound to user.")
            search( self.client, self.dn ).then( ( entry )=> {
                if (!entry || !entry.object || !entry.object) return reject( "LDAP Failed to bind" );
                self.setup(entry.object);
                resolve(self);
            }).catch((err)=>{ return reject( err ); });
        })
    }
}



const encodePassword = (password) => {
    let newPassword = '';
    password = "\"" + password + "\"";
    for (let i = 0; i < password.length; i++) {
       newPassword += String.fromCharCode(password.charCodeAt(i) & 0xFF,(password.charCodeAt(i) >>> 8) & 0xFF);
    }
    return newPassword;
}
const dnTopName = (dn) => { return String(dn).split(",")[0].split("=")[1]; }
const ouFromDn = (dn) => { return dn.split(",").slice(1).join(","); }
const formatURI = (URI) => {
    if ( URI.search(":") < 0 ) URI = `${URI}:636`;
    if ( URI.search("://") < 0 ) URI = `ldaps://${URI}`;
    return URI;
}
const connect = (URI, testing = false) => {
    return new Promise(function(resolve, reject) {
        if (!URI || URI==="") return reject({message:"Invalid URI"});
        try {
            const fURI = formatURI(URI);
            const tlsOptions = { 'rejectUnauthorized': false }
            const client = ldap.createClient({ url: [fURI], tlsOptions })
            for (let i = 0; i < errorTypes.length; i++) {
                client.on(errorTypes[i], (err) => {
                    console.error("LDAP:", errorTypes[i], err)
                    return reject(err);
                })
            }
            client.on('connect', () => {
                if (!client['secure']) return reject({message:"Secure / SSL connection required (eg. ldaps:// )."});
                if (testing) client.unbind();
                return resolve(client);
            })
        } catch(err){ reject(err); }
    })
}

const search = (client, query = '', options = {}) => {
    return new Promise(function(resolve, reject) {
        client.search(query, {...options}, (err, res) => {
        if (err) { return reject( err ); }
        res.on('searchEntry', (entry) => { return resolve(entry); });
        res.on('error', (err) => { return reject(err.message); });
        res.on('end', (err) => {
            if (err.status <= 0) return reject("User not found.");
            return reject(err);
        });
        });
    })
}

const login = (URI, username = '', password = '', testing = false) => {
    return new Promise(function(resolve, reject) {
        if ( !username || !password || !strValid(username) || !strValid(password) ) return reject({message:"Username & Password required", status: 422});
        connect( URI ).then( ( client )=> {
            client.on('resultError', (err) => {
                if (String(err).search("InvalidCredentialsError") >= 0){ return reject({message:"LDAP Username / Password incorrect", status: 401}); }
                if (String(err).search("InsufficientAccessRightsError") >= 0){ return reject({message:"Insufficient LDAP Rights", status: 401}); }
                if (String(err).search("ObjectclassViolationError") >= 0){ return reject({message:"Target does not exist", status: 404}); }
                if (String(err).search("NoSuchObjectError") >= 0){ return reject({message:"DN path does not exist", status: 404}); }
                return reject(err);
            })
            client.bind(username, password, function (err, res) {
                if (err) { return reject( err ); }
                search( client, '' ).then( ( entry )=> {
                if (!entry || !entry.object || !entry.object.namingContexts) return reject( {message:"LDAP Failed to bind"} );
                if (testing) client.unbind();
                return resolve({
                    client,
                    dn : entry.object.namingContexts[0]
                });
                }).catch((err)=>{ return reject( err ); });
            });
        }).catch((err)=>{ return reject( err ); });
    })
}

const add = (client, dn = '', attributes = {}) => {
    return new Promise(function(resolve, reject) {
        try {
            client.add(dn, attributes, (err, res) => {
                if (String(err).search("InsufficientAccessRightsError") >= 0){ return reject({message:"Insufficient LDAP Rights", status: 401}); }
                if (String(err).search("NoSuchObjectError") >= 0){ return reject({message:`Path Not Found: '${dn}'`, status: 404}); }
                if (err) { return reject(err) }
                search(client, dn, {
                    attributes: [ 'dn' ],
                    sizeLimit: 1000,
                    paged : true
                }).then( ( entry )=> {
                    const user = new User(entry.object, client);
                    resolve(user);
                }).catch((err)=>{ return reject( err ); });
            });
        } catch(e) {
            if (String(e).search("InsufficientAccessRightsError") >= 0){ return reject({message:"Insufficient LDAP Rights", status: 401}); }
            if (String(e).search("NoSuchObjectError") >= 0){ return reject({message:`Path Not Found: '${dn}'`, status: 404}); }
            reject(e);
        }
    })
}

function getUsers(client, base, attributes = []){
    let usersArray = [];
    let usersObject = {};
    let usernames = [];
    return new Promise(function(resolve, reject) {
      try{
        client.search(base, {
          scope : "sub",
          filter: "(objectCategory=Person)",
          attributes: [
            'dn',
            'cn',
            'sAMAccountName',
            'displayName',
            'userPrincipalName',
            'userAccountControl',
            'memberOf',
            ...attributes
          ],
          sizeLimit: 1000,
          paged : true
        }, (err, res) => {
            if (err) { return reject( err ); }
            res.on('searchEntry', (entry) => {
                usersArray.push(entry.object);
                const username = String(entry.object.sAMAccountName).toLowerCase();
                usernames.push(username);
                const user = entry.object
                usersObject[username] = user;
            });
            res.on('error', (err) => {
                if (String(err).search("NoSuchObjectError") >= 0){ return reject({message:`Path Not Found: '${base}'`, status: 404}); }
                reject(err);
                });
            res.on('end', (result) => {
                if (result.status !== 0) reject( "Failed to query LDAP, error code: " + result.status );
                resolve({usersArray, usernames, usersObject});
            });
        });
      } catch(e) {
        reject(e)
      }
    });
  }


export {
    User,
    encodePassword,
    dnTopName,
    ouFromDn,
    formatURI,
    connect,
    login,
    search,
    add,
    getUsers
}
