import { default as ldapjs } from "ldapjs";

export class ldap {
    public client: ldapjs.Client|undefined;
    public connected: boolean = false;
    public base: string = '';
    constructor() {
    }
    /**
     * Connects to an LDAP server.
     * @param {string} url URL of target server. Examples:
     * - `ldap://127.0.0.1:1389` (fully qualified URL)
     * - `sub.domain.com` (short form domain)
    **/
    public connect(url: string): Promise<ldapjs.Client> {
        return new Promise((resolve, reject) => {
            try {
                const tlsOptions = { 'rejectUnauthorized': false } // ldap(s) validation
                const client = ldapjs.createClient({
                    url: [url],
                    tlsOptions
                });
                client.on('error', (err) => reject(err));
                client.on('connectRefused', (err) => reject(err));
                client.on('connectTimeout', (err) => reject(err));
                client.on('socketTimeout', (err) => reject(err));
                client.on('connectError', (err) => reject(err));
                client.on('connect', () => {
                    this.client = client;
                    this.connected = true;
                    return resolve(client);
                });
            } catch (e) { reject(e); }
        });
    }
    /**
     * Disconnect from LDAP server.
    **/
    public unbind(): Promise<true> {
        return new Promise((resolve, reject) => {
            if (!this.client) return reject(Error("Not connected."));
            try {
                this.client.unbind((err) => {
                    if (err) return reject( err );
                    return resolve(true);
                });
            } catch (e) { reject(e); }
        });
    }
    /**
     * Disconnect from LDAP server.
     * Alias of unbind.
    **/
    public disconnect = this.unbind;
    /**
     * Disconnect from LDAP server.
     * Alias of unbind.
    **/
    public close = this.unbind;
    /**
     * Login/Bind to an active LDAP connecton.
     * @param {string} username The DN to bind as. Examples:
     * - `domain\username`
     * - `username@domain.com`
     * - `cn=John Smith,ou=users,dc=domain,dc=com`
     * - `domain.com/users/John Smith`
     * @param {string} password The password associated with the DN.
    **/
    public login(username: string, password: string): Promise<true> {
        return new Promise((resolve, reject) => {
            if (!this.client) return reject(Error("Not connected."));
            try {
                this.client.bind(username, password, function (err) {
                    if (err) return reject( err );
                    return resolve(true);
                });
            } catch (e) { reject(e); }
        });
    }
    /**
     * Retrieve root DN of connection, eg: dc=ldap,dc=domain,dc=com
    **/
    public getRoot(): Promise<string> {
        return new Promise((resolve, reject) => {
            //return resolve("dc=example,dc=com");
            //return resolve("ldap,dc=forumsys,dc=com");
            if (!this.client) return reject(Error("Not connected."));
            const opts: ldapjs.SearchOptions = { attributes: 'rootDomainNamingContext' };
            this.client.search('', opts, (err: ldapjs.Error | null, res: ldapjs.SearchCallbackResponse ) => {
                if (err) return reject( err );
                res.on('searchEntry', (entry) => {
                    if (!entry.attributes || !entry.attributes[0] || !entry.attributes[0].values || !entry.attributes[0].values[0]) {
                        console.log(entry.attributes)
                        return reject(Error("Root DSE could not be autoresolved."));
                    }
                    resolve(entry.attributes[0].values[0]);
                });
                res.on('error', (err) => reject(err));
                res.on('end', (result) => {
                    if (!result || result.status !== 0) return reject(Error("rootDomainNamingContext not found."));
                });
            });
        });
    }
    /**
     * Return a single user where key = value.
     * @param {string} key Object Attribute
     * @param {string} value Expected value of attribute
     * @param {string[]} attributes Array of specific attributes to get (optional)
    **/
    public searchUser(key: string, value: string, attributes?: string[]): Promise<ldapjs.SearchEntry|undefined> {
        return new Promise((resolve, reject) => {
            if (!this.client) return reject(Error("Not connected."));
            const opts: ldapjs.SearchOptions = {
                filter: `(&(objectCategory=Person)(${key}=${value}))`,
                scope: 'sub',
                sizeLimit: 1000,
                paged : true,
                attributes: attributes || key
            };
            this.client.search(this.base, opts, (err: ldapjs.Error | null, res: ldapjs.SearchCallbackResponse ) => {
                if (err) return reject( err );
                res.on('error', (err) => reject(err));
                res.on('searchEntry', (entry) =>  resolve(entry) );
                res.on('end', () => {
                    resolve(undefined);
                });
            });
        });
    }
    /**
     * Return a single object.
     * @param {object} options SearchOptions
     * @param {string} base Base DN search path (optional)
    **/
    public searchOne(options: ldapjs.SearchOptions, base?: string): Promise<ldapjs.SearchEntry> {
        return new Promise((resolve, reject) => {
            if (!this.client) return reject(Error("Not connected."));
            this.client.search(base||this.base, options, (err: ldapjs.Error | null, res: ldapjs.SearchCallbackResponse ) => {
                if (err) return reject( err );
                res.on('error', (err) => reject(err));
                res.on('searchEntry', (entry) =>  resolve(entry) );
            });
        });
    }
    /**
     * Return all objects matching the filter.
     * @param {string[]} attributes Array of specific attributes to get (optional)
     * @param {string} filter Search filter. (optional, default: (objectclass=person) )
    **/
    public search(attributes?: string[], filter: string = '(objectclass=person)'): Promise<User[]> {
        return new Promise((resolve, reject) => {
            if (!this.client) return reject(Error("Not connected."));
            const usersArray: User[] = [];
            const opts: ldapjs.SearchOptions = {
                filter,
                scope: 'sub',
                sizeLimit: 1000,
                paged: true,
                attributes
            };
            this.client.search(this.base, opts, (err: ldapjs.Error | null, res: ldapjs.SearchCallbackResponse ) => {
                if (err) return reject( err );
                let startTime = performance.now();
                let counter = 0;
                res.on('searchEntry', (entry) => {
                    const endTime = performance.now();
                    const elapsedTime = endTime - startTime;
                    if (elapsedTime>5000) counter++; //REVIEW - might be worth adding timeout settings to GUI
                    if (counter>3 && usersArray.length<200) return reject(Error(`Requests taking longer than ${Math.round(elapsedTime)} milliseconds. Abandoned after ${usersArray.length} rows.`));
                    const user: {[k: string]: string} = {};
                    for (const attribute of entry.attributes) {
                        user[attribute.type] = ((attribute.values||[]) as string[]).join();
                    }
                    usersArray.push(new User(entry, this.client ));
                    startTime = performance.now();
                });
                res.on('error', (err) => reject(err));
                res.on('end', (result) => {
                    if (!result || result.status !== 0) return reject(Error("Nothing found."));
                    resolve(usersArray)
                });
            });
        });
    }
    /**
     * Return all users.
     * @param {string[]} attributes Array of specific attributes to get (optional)
     * @param {string} id Attribute to use as key for object response (optional)
    **/
    public getUsers(attributes?: string[], id?: string): Promise<{array: {[k: string]: string}[], object: {[k: string]: User}}> { //TODO - remove this
        return new Promise((resolve, reject) => {
            if (!this.client) return reject(Error("Not connected."));
            const usersArray: {[k: string]: string}[] = [];
            const userObj: {[k: string]: User} = {};
            const opts: ldapjs.SearchOptions = {
                filter: '(objectclass=person)',
                scope: 'sub',
                sizeLimit: 1000,
                paged: true,
                attributes
            };
            this.client.search(this.base, opts, (err: ldapjs.Error | null, res: ldapjs.SearchCallbackResponse ) => {
                if (err) return reject( err );
                res.on('searchEntry', (entry) => {
                    const user: {[k: string]: string} = {};
                    for (const attribute of entry.attributes) {
                        user[attribute.type] = ((attribute.values||[]) as string[]).join();
                        if (id&&attribute.type===id){ userObj[user[attribute.type]] = new User(entry, this.client ); }
                    }
                    usersArray.push(user);
                });
                res.on('error', (err) => reject(err));
                res.on('end', (result) => {
                    if (!result || result.status !== 0) return reject(Error("Nothing found."));
                    resolve({array: usersArray, object: userObj})
                });
            });
        });
    }
    /**
     * Create a new ldap object.
     * @param {string} dn DN path to create. Gets prepended to base path.
     * @param {object} attributes Key/Value object of attributes for ldap object.
     * @param {string[]|string} returnAttributes Array/String of attributes to return. (Optional)
    **/
    public create(dn: string = '', attributes: { [k: string]: string|string[] } = {}, returnAttributes?: string|string[] ): Promise<ldapjs.SearchEntry> {
        return new Promise((resolve, reject) => {
            if (!this.client) return reject(Error("Not connected."));
            this.client.add(`${dn},${this.base}`, attributes, async (err: ldapjs.Error | null) => {
                if (err) return reject( err );
                if (!this.client) return reject(Error("Not connected."));
                const found = await this.searchOne({ attributes: returnAttributes || 'dn', sizeLimit: 1000, paged: true }, `${dn},${this.base}`);
                if (found) return resolve(found);
                reject(Error("Could not locate object after creation."));
            });
        });
    }
    /**
     * Encode password string for unicodePwd attribute field.
     * @param {string} password Password
    **/
    static encodePassword(password: string) {
        let newPassword = '';
        password = "\"" + password + "\"";
        for (let i = 0; i < password.length; i++) {
           newPassword += String.fromCharCode(password.charCodeAt(i) & 0xFF,(password.charCodeAt(i) >>> 8) & 0xFF);
        } return newPassword;
    }
    /**
     * Get top name from DN string. Usage:
     *- Input: OU=Users,DC=domain,DC=com
     *- Output: Users
     * @param {string} dn DN path
    **/
    static dnTopName(dn: string) { return String(dn).split(",")[0].split("=")[1]; }
    /**
     * Get top level key=value pair from DN string. Usage:
     *- Input: OU=Users,DC=domain,DC=com
     *- Output: OU=Users
     * @param {string} dn DN path
    **/
    static dnTop(dn: string) { return String(dn).split(",")[0]; }
    /**
     * Removes top-level object from DN path. Usage:
     *- Input: CN=Administrator,OU=Users,DC=domain,DC=com
     *- Output: OU=Users,DC=domain,DC=com
     * @param {string} dn DN path
    **/
    static ouFromDn(dn: string) { return dn.split(",").slice(1).join(","); }
    /**
     * Validate a User Principal Name. Usage:
     * @param {string} upn UPN
    **/
    static validUpn(upn: string) { return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(upn) }
    /**
     * Validate a Security Account Manager (sAM) Account Name. Usage:
     * @param {string} sAM sAM
    **/
    static validSam(sAM: string) { return sAM !== "" && (!/[/\\[\]:;"|=,+*?<>]/.test(sAM)) && sAM.length <= 20 }
}

export const FLAGS = {
    ACCOUNTDISABLE: 2,
    NORMAL_ACCOUNT: 512,
    DONT_EXPIRE_PASSWORD: 65536,
};

/**
 * Create instance of an ldap user.
 * @param {ldapjs.SearchEntry} object The SearchEntry data for this user.
 * @param {ldapjs.Client} client ldap client to bind to. Required to perform actions on user. (Optional)
**/
export class User {
    private client: ldapjs.Client|undefined;
    public stringified: { [attribute: string]: string } = {};
    public attributes: {
        distinguishedName: string,
        memberOf: string[],
        userAccountControl: number,
        [name:string]: string|string[]|number
    } = {
        distinguishedName: '',
        memberOf: [],
        userAccountControl: 0,
    };
    public ou: string|undefined;
    public groups: string[] = [];
    constructor(object: ldapjs.SearchEntry, client?: ldapjs.Client) {
        if (!object) throw Error("Failed to build class User: entry not defined");
        for (const attribute of object.attributes) {
            this.stringified[attribute.type] = ((attribute.values||[]) as string[]).join();
            this.attributes[attribute.type] =
            Array.isArray(attribute.values) && attribute.values.length === 1 ? attribute.values[0] : attribute.values;
        }
        if (this.attributes.distinguishedName) this.ou = ldap.ouFromDn(this.attributes.distinguishedName).toLowerCase();
        this.client = client;
        for (const dn of this.attributes.memberOf){
            this.groups.push(ldap.dnTopName(dn));
        }
    }
    /**
     * Checks if user is enabled. Requires userAccountControl attribute.
    **/
    enabled = () => ( (this.attributes.userAccountControl & FLAGS.ACCOUNTDISABLE) === 0 )
    /**
     * Checks if user is disabled. Requires userAccountControl attribute.
    **/
    disabled = () =>!this.enabled()
    /**
     * Disables the user. Requires client.
    **/
    disable = () => this.enable(true);
    /**
    * Enables the user. Requires client.
    * @param {boolean} disable Disable instead of enable
    **/
    enable(disable: boolean = false): Promise<true> {
        return new Promise((resolve, reject) => {
            if (!this.attributes.distinguishedName) return reject(`Data malformed. ${JSON.stringify(this.attributes)} `);
            if (!this.client) return reject("No client found.");
            if (!disable) if ( this.enabled() ) return reject("Already enabled.");
            if (disable) if ( !this.enabled() ) return reject("Already disabled.");
            const userAccountControl = disable ?
            (this.attributes.userAccountControl | (FLAGS.ACCOUNTDISABLE)) : // Bitwise OR (add flag)
            (this.attributes.userAccountControl &= ~(FLAGS.ACCOUNTDISABLE)); // Bitwise NOT (remove flag)
            const change = new ldapjs.Change({
                operation: 'replace',
                modification: new ldapjs.Attribute({
                    type: 'userAccountControl',
                    values: String(userAccountControl)
                })
            });
            this.client.modify(this.attributes.distinguishedName, change, (err: Error) => {
                if (err) return reject(err);
                this.attributes.userAccountControl = userAccountControl;
                resolve(true);
            } );
        });
    }
    /**
    * Perform an attribute change. Requires client.
    * @param {ldapjs.Change} change ldapjs.Change operation.
    * See http://ldapjs.org/ for details.
    **/
    change(change: ldapjs.Change): Promise<true> {
        return new Promise((resolve, reject) => {
            if (!this.attributes.distinguishedName) return reject(`Data malformed. ${JSON.stringify(this.attributes)} `);
            if (!this.client) return reject("No client found.");
                this.client.modify(this.attributes.distinguishedName, change, (err: Error) => {
                if (err) return reject(err);
                resolve(true);
            } );
        });
    }
    /**
     * Delete user from directory.
    **/
    delete(): Promise<true> {
        return new Promise((resolve, reject) => {
            if (!this.attributes.distinguishedName) return reject(`Data malformed. ${JSON.stringify(this.attributes)} `);
            if (!this.client) return reject("No client found.");
            this.client.del(this.attributes.distinguishedName, (err: Error) => {
                if (err) return reject(err);
                resolve(true);
            } );
        });
    }
    /**
     * Modifies the users distinguished name.
     * @param {string} dn New DN path after change
    **/
    modifyDN(dn: string): Promise<true> {
        return new Promise((resolve, reject) => {
            if (!this.attributes.distinguishedName) return reject(`Data malformed. ${JSON.stringify(this.attributes)} `);
            if (!this.client) return reject("No client found.");
            this.client.modifyDN(this.attributes.distinguishedName, dn, (err: Error) => {
                if (err) return reject(err);
                resolve(true);
            } );
        });
    }
    /**
     * Check if user is a child of an organisational unit.
     * @param {string} ouOrName Parent OU path or name.
    **/
    childOf(ouOrName: string): boolean {
        if (!this.ou) return false;
        if (this.ou===(ouOrName.toLowerCase())) return true;
        if (ldap.dnTopName(this.ou)===(ouOrName.toLowerCase())) return true;
        return false;
    }
    /**
     * Move the user to the target organisational unit.
     * @param {string} ou OU to place the user in.
    **/
    move(ou: string): Promise<true> {
        const top = ldap.dnTop(this.attributes.distinguishedName);
        return this.modifyDN(`${top},${ou}`);
    }
    /**
     * Rename the user.
     * @param {string} name New name.
    **/
    rename(name: string): Promise<true> {
        const ou = ldap.ouFromDn(this.attributes.distinguishedName);
        return this.modifyDN(`${name},${ou}`);
    }
    /**
     * Remove user from security group.
     * @param {string} dn Security group DN path
    **/
    removeGroup = (dn: string = '') => this.addGroup(dn, true);
    /**
     * Check if user is part of a security group.
     * @param {string} dnOrName Security group DN path OR  top-level name.
    **/
    hasGroup = (dnOrName: string = ''): boolean => {
        if (this.groups.map(g=>g.toLowerCase()).includes(dnOrName.toLowerCase())) return true;
        if (this.attributes.memberOf.map(g=>g.toLowerCase()).includes(dnOrName.toLowerCase())) return true;
        return false;
    }
    /**
     * Add user to security group.
     * @param {string} dn Security group DN path
    **/
    addGroup = (dn: string = '', remove = false): Promise<true> => {
        return new Promise((resolve, reject) => {
            if (remove ? !this.hasGroup(dn) :  this.hasGroup(dn)) return true;
            if (!this.attributes.distinguishedName) return reject(`Data malformed. ${JSON.stringify(this.attributes)} `);
            if (!this.client) return reject("No client found.");
            const change = new ldapjs.Change({
                operation: remove ? 'delete' : 'add',
                modification: new ldapjs.Attribute({
                    type: 'member',
                    values: this.attributes.distinguishedName
                })
            });
            this.client.modify(dn, change, (err: Error) => {
                if (err){
                    if ((String(err)).includes('OperationsError')) return reject(Error(`Path Not Found: '${dn}' (OperationsError) `));
                    return reject(err);
                }
                if (remove){
                    this.groups = this.groups.filter(n=>n!==ldap.dnTopName(dn))
                } else {
                    this.groups.push(ldap.dnTopName(dn));
                }
                resolve(true);
            } );
        })
    }
    
}

export default ldap;
