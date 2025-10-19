import https from 'https';
import httpntlm, { HttpntlmOptions, HttpntlmResponse } from 'httpntlm';
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, AxiosProxyConfig } from 'axios';

/**
 * F5 eduSTAR School Technology Management Centre
 * ===========================================================================
 * Programmatic API wrapper for the eduSTAR School Technology Management Centre
 * 
 * Implements dual-authentication for accessing resources depending on network origin.
 * 1. NTLM (NT LAN Manager) Authentication
 *    - Used when accessing from outside the eduSTAR subnet (e.g., via Citrix VPN)
 *    - Leverages the httpntlm library for Windows domain authentication (Use "github:mattkrins/node-http-ntlm" for fatal error fixed branch)
 *    - Credentials (username/password) are sent with EVERY request
 *    - No cookie-based session management; authentication on each call
 * 2. Form-Based Authentication
 *    - Used when accessing from within the eduSTAR network
 *    - Traditional web form login with session cookies
 *    - Requires multi-step authentication handshake
 *    - Session maintained via cookies after successful login
 * 
 * @param {AxiosProxyConfig} [proxy] - Optional Axios proxy configuration.
 * @example
 * const client = new eduSTAR();
 * await client.login('user', 'pass');
 * console.log(await client.whoAmI());
*/
export class eduSTAR {
  private readonly urlBase: string = "https://apps.edustar.vic.edu.au";
  private readonly urlPolicy: string;
  private readonly urlMcApi: string;
  private readonly urlGetUser: string;
  private headers: Record<string, string>;
  private agent: https.Agent;
  private axios: AxiosInstance;
  private usingNtlm: boolean = false;
  private cookies: string = "";
  private credentials = { username: "", password: "" };
  public authenticated: boolean = false;
  constructor(proxy?: AxiosProxyConfig) {
    this.urlPolicy = `${this.urlBase}/my.policy`;
    this.urlMcApi = `${this.urlBase}/edustarmc/api/MC`;
    this.urlGetUser = `${this.urlMcApi}/GetUser`;
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
      'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
      'Sec-GPC': '1',
      'Cookie': 'BIGipServerEB_PRD_eduSTAR_2012_Web_Farm_80=722864650.20480.0000'
    };
    this.agent = new https.Agent({ keepAlive: true });
    this.axios = axios.create({ httpsAgent: this.agent, maxRedirects: 0, proxy });
  }
  private updateCookies(response: AxiosResponse | HttpntlmResponse): void {
    let newCookies: string = this.cookies;
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const responseCookies: string[] = Array.isArray(setCookieHeader) ? setCookieHeader.map((cookie: string) => cookie.split(';')[0]) : [setCookieHeader.split(';')[0]];
      const existingCookieObj: Record<string, string> = {};
      if (newCookies) {
        newCookies.split('; ').forEach((cookie: string) => {
          const [name, value] = cookie.split('=');
          if (name) existingCookieObj[name] = value || '';
        });
      }
      responseCookies.forEach((cookie: string) => {
        const [name, value] = cookie.split('=');
        if (name) existingCookieObj[name] = value || '';
      });
      newCookies = Object.entries(existingCookieObj).map(([name, value]: [string, string]) => `${name}=${value}`).join('; ');
    }
    this.cookies = newCookies;
  }
  private buildHeaders(referer: string = "", headers: Record<string, string> = {}): AxiosRequestConfig {
    return { headers: { ...this.headers, 'Cookie': this.cookies, 'Referer': referer, ...headers } };
  }
  private ntlmAuth(username: string, password: string): Promise<HttpntlmResponse> {
    return new Promise((resolve, reject) => {
      function error(err: Error): void {
        process.removeListener('uncaughtException', error);
        reject(err);
      }
      process.once('uncaughtException', error);
      try {
        const options = {
          url: this.urlGetUser,
          username,
          password,
          domain: 'EDU001',
          workstation: '',
          agent: this.agent,
          ...this.buildHeaders()
        };
        httpntlm.get(options as unknown as HttpntlmOptions, (err: Error | null, res?: HttpntlmResponse) => {
          if (!res) return reject(err);
          if (err) return reject(err);
          if (res?.statusCode !== 200) return reject(new Error(`Unknown ${res?.statusCode} error.`));
          this.usingNtlm = true;
          this.credentials.username = username;
          this.credentials.password = password;
          this.authenticated = true;
          resolve(res as HttpntlmResponse);
        });
      }
      catch (err) { reject(err); }
      finally { process.removeListener('uncaughtException', error); }
    });
  }
  private async formAuth(username: string, password: string): Promise<void> {
    try { await this.axios.get(this.urlGetUser, { ...this.buildHeaders() }); }
    catch (err: unknown) {
      const axiosError = err as { status?: number; response?: AxiosResponse };
      if (axiosError.status !== 302) throw new Error(String(err));
      if (axiosError.response) this.updateCookies(axiosError.response);
    }
    try {
      const init: AxiosResponse = await this.axios.get(this.urlPolicy, { ...this.buildHeaders(this.urlPolicy) } );
      this.updateCookies(init);
    } catch (err: unknown) { throw new Error(String(err)); }
    const payload = new URLSearchParams();
    payload.append('username', username);
    payload.append('password', password);
    try {
      const login: AxiosResponse = await this.axios.post(
        this.urlPolicy,
        payload,
        { ...this.buildHeaders(this.urlPolicy, { 'Content-Type': 'application/x-www-form-urlencoded' }) }
      );
      const errorMatch = (login.data || "").match(/"retry"\s*:\s*\{[^}]*?"message"\s*:\s*"([^"]+)"/);
      if (errorMatch) throw new Error(errorMatch[1]);
      throw new Error("Unknown login failure.");
    } catch (err: unknown) {
      const axiosError = err as { status?: number; response?: AxiosResponse; message?: string };
      if (axiosError.status !== 302) throw new Error(axiosError.message || String(err));
      if (axiosError.response) this.updateCookies(axiosError.response);
      this.authenticated = true;
    }
  }
  private request<T = unknown>(method: HttpMethod, path: string, data?: unknown): Promise<T> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (!this.authenticated) { return reject(new Error("EduSTAR Not authenticated.")); }
      const url = `${this.urlMcApi}${path}`;
      if (this.usingNtlm) {
        try {
          const options  = {
            url,
            username: this.credentials.username,
            password: this.credentials.password,
            domain: 'EDU001',
            workstation: '',
            agent: this.agent,
            body: data,
            ...this.buildHeaders()
          };
          httpntlm[method](options as unknown as HttpntlmOptions, (err: Error | null, res?: HttpntlmResponse) => {
            if (err) return reject(err);
            try {
              const json: T = JSON.parse(res?.body as string);
              return resolve(json);
            } catch (parseErr: unknown) {
              return reject(parseErr);
            }
          });
        } catch (err: unknown) {
          return reject(err);
        }
      } else{ 
        try {
          const response: AxiosResponse<T> = await this.axios[method](url, { data, ...this.buildHeaders(url) } );
          return resolve(response.data);
        } catch (err: unknown) { return reject(err); }
      }
    });
  }
  /**
   * Attempt login using NTLM first and fall back to form-based authentication.
   * @param {string} username - Login username.
   * @param {string} password - Login password.
   * @example
   * await client.login('user', 'pass');
  */
  public async login(username: string, password: string): Promise<void> {
    try { await this.ntlmAuth(username, password); }
    catch (err: unknown) {
      console.warn('NTLM failure:', err);
      try { await this.formAuth(username, password); }
      catch (err: unknown) { console.warn('Form Login failure:', err); }
    }
    if (!this.authenticated) throw new Error("All authentication methods failed.");
  }
  /**
   * Retrieve information about the authenticated user.
   * @returns {Promise<T>} user info.
   * @example
   * await client.whoAmI(); > { _dn: "", _displayName: "", ... }
  */
  public async whoAmI<T = whoAmIResponse>(): Promise<T> {
    return this.request<T>("get", "/GetUser");
  }
  /**
   * Get user info (name, dn, etc.) by TO number / alias.  
   * @param {string} id - TO number.
   * @returns {Promise<T>} User info.
   * @example
   * await client.getUser("12345678"); > { _dn: "" _firstName: "", ... }
  */
  public async getUser<T = groupMember>(id: string): Promise<T> {
    return this.request<T>("get", `/GetUserDnByLogin/${id}`);
  }
  /**
   * Get schools available to the authenticated user.
   * @returns {Promise<T>} Array of school objects.
   * @example
   * await client.getSchools(); > { SchoolName: "" SchoolId: "", ... }
  */
  public async getSchools<T = school[]>(): Promise<T> {
    return this.request<T>("get", "/GetAllSchools");
  }
  /**
   * Get all school numbers.
   * @returns {Promise<T>} Array of school objects.
   * @example
   * await client.getAllSchools(); > [ "0001", "0002", ... ]
  */
  public async getAllSchools<T = string[]>(): Promise<T> {
    return this.request<T>("get", "/GetAllEnabledSchools");
  }
  /**
   * Get IPAM info for a school campus.
   * @param {number|string} school - School id.
   * @param {number|string} [campus=1] - Campus number (default: 1).
   * @returns {Promise<T>} IP info object.
   * @example
   * await client.getIpInfo(1234); > { _ns_admin_dc: "", ... }
  */
  public async getIpInfo<T = IpInfoResponse>(school: number|string, campus: number|string = 1): Promise<T> {
    return this.request<T>("get", `/GetIPAMInfo/${school}/${String(campus).padStart(2, '0')}`);
  }
  /**
   * Get network policy server mapping for a school.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} NPS mapping object.
   * @example
   * await client.getNps(1234); > { SchoolId: "", ... }
  */
  public async getNps<T = npsResponse>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetSchoolNPSMapping/${school}`);
  }
  /**
   * Get staff (techs and staff lists) for a school.
   * @param {number|string} school - School id.
   * @param {boolean} [allStaff=true] - Include all staff (true) or only techs (false).
   * @returns {Promise<T>} Staff object.
   * @example
   * await client.getStaff(1234); > { _techs: [ { _dn: "", ... } ], _staff: [ ... ], ... }
  */
  public async getStaff<T = staffResponse>(school: number|string, allStaff: boolean = true): Promise<T> {
    return this.request<T>("get", `/GetSchoolTechs/${school}/${allStaff}`);
  }
  /**
   * Convenience wrapper to get technicians only.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Technician object.
   * @example
   * await client.getTechnicians(1234); > { _techs: [ { _dn: "", ... } ], _staff: [ ... ], ... }
  */
  public async getTechnicians<T = staffResponse>(school: number|string): Promise<T> {
    return this.getStaff(school, false);
  }
  /**
   * Get students for a school.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Array of students.
   * @example
   * await client.getStudents(1234); > [ { _login: "", ... }, ... ]
  */
  public async getStudents<T = student[]>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetStudents/${school}/FULL`);
  }
  /**
   * Set a single student's password.
   * @param {number|string} school - School id.
   * @param {string} dn - Distinguished name of student.
   * @param {string} password - New password to set.
   * @example
   * await client.setStudentPassword(1234, "cn=john,dn=domain", "pass");
  */
  public async setStudentPassword<T = void>(school: number|string, dn: string, password: string): Promise<T> {
    const data: passwordResetRequest = { dn, newPass: password, schoolId: `${school}` };
    return this.request<T>("post", "/ResetStudentPwd", data);
  }
  /**
   * Bulk set student passwords from a list.
   * @param {number|string} school - School id.
   * @param {passwordReset[]} passwordList - Array of login/password objects.
   * @returns {Promise<T>} Array of password generation outcomes.
  */
  public async setStudentPasswords<T = passwordGenerateOutcome[]>(school: number|string, passwordList: passwordReset[]): Promise<T> {
    const data: passwordsResetRequest = { _schoolId : `${school}`, _rows : passwordList };
    return this.request<T>("post", "/BulkSetPasswordCSV", data);
  }
  /**
   * Reset / Generate multiple student passwords.
   * @param {number|string} school - School id.
   * @param {string[]} dnList - List of distinguished names to reset.
   * @returns {Promise<T>} Array of password generation outcomes.
  */
  public async resetStudentPasswords<T = passwordGenerateOutcome[]>(school: number|string, dnList: string[], mode: "auto"|"manual" = "auto"  ): Promise<T> {
    const data: passwordsGenerateRequest = { _schoolId : `${school}`, _newPass : null, _mode: mode, _dns: dnList };
    return this.request<T>("post", "/BulkSetPassword", data);
  }
  /**
   * Get members of a specified group.
   * @param {number|string} school - School id.
   * @param {string} name - Group display name.
   * @param {string} dn - Group distinguished name.
   * @returns {Promise<T>} Array of group members.
  */
  public async getGroup<T = groupMember[]>(school: number|string, name: string, dn: string): Promise<T> {
    return this.request<T>("get", `/GetGroupMembers?schoolId=${school}&groupDn=${dn}&groupName=${name}`);
  }
  /**
   * Get groups for a school.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Groups object.
  */
  public async getGroups<T = groupsResponse>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetSchoolGroups/${school}`);
  }
  /**
   * Add a member to a group.
   * @param {number|string} school - School id.
   * @param {string} groupDn - Group distinguished name.
   * @param {string} memberDn - Member distinguished name to add.
   * @returns {Promise<T>} True on success.
  */
  public async addToGroup<T = true>(school: number|string, groupDn: string, memberDn: string): Promise<T> {
    return this.request<T>("post", `/AddGroupMember?schoolId=${school}&groupDn=${groupDn}&memberDn=${memberDn}`);
  }
  /**
   * Remove a member from a group.
   * @param {number|string} school - School id.
   * @param {string} groupDn - Group distinguished name.
   * @param {string} memberDn - Member distinguished name to remove.
  */
  public async deleteFromGroup<T = void>(school: number|string, groupDn: string, memberDn: string): Promise<T> {
    return this.request<T>("post", `/RemoveMember?schoolId=${school}&groupDn=${groupDn}&memberDn=${memberDn}`);
  }
  /**
   * Get certificates for a school.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Array of certificate(s).
  */
  public async getCertificates<T = computer[]>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetSchoolManagedComputers/${school}`);
  }
  /**
   * Add a certificate for a school.
   * @param {number|string} school - School id.
   * @param {string} name - Certificate name.
   * @param {string} password - password for the certificate.
   * @returns {Promise<T>} Created certificate.
  */
  public async addCertificate<T = computer[]>(school: number|string, name: string, password: string, schoolPrefix: boolean = true): Promise<T> {
    return this.request<T>("post", `/AddManagedComputer?schoolId=${school}&computerName=${schoolPrefix?`${school}-`:''}${name}&password=${password}`);
  }
  /**
   * Delete a certificate by DN.
   * @param {number|string} school - School id.
   * @param {string} dn - Distinguished name of the certificate to delete.
  */
  public async deleteCertificate<T = void>(school: number|string, dn: string): Promise<T> {
    return this.request<T>("post", `/DeleteComputer?schoolId=${school}&dn=${dn}`);
  }

  //TODO - Implement certificate downloading.

  /**
   * Get school service accounts.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Array of service accounts.
  */
  public async getServiceAccounts<T = student[]>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetSchoolServiceAccounts/${school}`);
  }
  /**
   * Add a service account for a school.
   * @param {number|string} school - School id.
   * @param {string} name - Account Full name.
   * @param {string} fName - First name.
   * @param {string} lName - Last name.
   * @param {string} login - Login / Username.
   * @param {string} password - Password.
   * @param {"Service Account"|"Visiting Staff"|"Visiting Student"} type - Service Account, Visiting Staff or Visiting Student.
   * @returns {Promise<T>} Created service account.
  */
  public async addServiceAccounts<T = serviceAccount>(
    school: number|string,
    name: string, fName: string,
    lName: string, login: string,
    password: string,
    type: "Service Account"|"Visiting Staff"|"Visiting Student",
    schoolPrefix: boolean = true
  ): Promise<T> {
    return this.request<T>("post", `/AddServiceAccount?schoolId=${school}&firstName=${fName}&lastName=${lName}&fullName=${schoolPrefix?`${school}-`:''}${name}&logonName=${schoolPrefix?`${school}-`:''}${login}&password=${password}&type=${type}`);
  }
  /**
   * Delete a service account.
   * @param {number|string} school - School id.
   * @param {string} dn - Distinguished name of the account to delete.
   * @returns {Promise<T>} user object.
  */
  public async deleteServiceAccount<T = student[]>(school: number|string, dn: string): Promise<T> {
    return this.request<T>("post", `/DeleteServiceAccount?schoolId=${school}&dn=${dn}`);
  }
  /**
   * Disable a service account.
   * @param {number|string} school - School id.
   * @param {string} dn - Distinguished name.
  */
  public async disableServiceAccount<T = void>(school: number|string, dn: string): Promise<T> {
    return this.request<T>("post", `/DisableServiceAccount?schoolId=${school}&dn=${dn}`);
  }
  /**
   * Enable a service account.
   * @param {number|string} school - School id.
   * @param {string} dn - Distinguished name.
  */
  public async enableServiceAccount<T = void>(school: number|string, dn: string): Promise<T> {
    return this.request<T>("post", `/EnableServiceAccount?schoolId=${school}&dn=${dn}`);
  }
  /**
   * Reset a service account password.
   * @param {number|string} school - School id.
   * @param {string} dn - Distinguished name of the service account.
   * @returns {Promise<T>} New password.
  */
  public async resetServiceAccountPassword<T = string>(school: number|string, dn: string): Promise<T> {
    return this.request<T>("post", `/ResetServiceAccount?schoolId=${school}&dn=${dn}`);
  }
  /**
   * Get current screen saver policy for a school.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Screen saver policy string. "20", "30", etc.
  */
  public async getScreenSaverPolicy<T = string>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetSchoolScreenSaverPolicy/${school}`);
  }
  /**
   * Set the screen saver policy value (minutes) for a school.
   * @param {number|string} school - School id.
   * @param {number|string} [minutes="20"] - Minutes value for the policy.
   * @returns {Promise<T>} Updated school object.
  */
  public async setScreenSaverPolicy<T = school>(school: number|string, minutes: number|string = "20"): Promise<T> {
    return this.request<T>("post", `/SetScreenSaverPolicy?schoolId=${school}&screenSaverValue=${minutes}`);
  }
  /**
   * Get school computers.
   *
   * @template T
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Computers object.
  */
  public async getComputers<T = computersResponse>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetSchoolCaseComputers/${school}`);
  }
  /**
   * Add an admin computer for a school/campus.
   * @param {number|string} school - School id.
   * @param {number|string} [campus=1] - Campus number.
   * @param {number|string} number - Computer number
  */
  public async addAdminComputer<T = void>(school: number|string, campus: number|string = 1, number: number|string): Promise<T> {
    return this.request<T>("post", `/AddCaseComputer?schoolId=${school}&computerName=${school}AWS${String(campus).padStart(2, '0')}${String(number).padStart(2, '0')}`);
  }
  /**
   * Add a local curriculum computer.
   * @param {number|string} school - School id.
   * @param {string} name - Computer name.
  */
  public async addLocalComputer<T = void>(school: number|string, name: string, schoolPrefix: boolean = true): Promise<T> {
    return this.request<T>("post", `/AddCurricComputer?schoolId=${school}&computerName=${schoolPrefix?`${school}-`:''}${name}`);
  }
  /**
   * Delete computer by DN.
   * @param {number|string} school - School id.
   * @param {string} dn - Distinguished name.
  */
  public async deleteComputer<T = void>(school: number|string, dn: string): Promise<T> {
    return this.request<T>("post", `/DeleteComputer?schoolId=${school}&dn=${dn}`);
  }
  /**
   * Get centrally managed servers for a school.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Array of managed servers.
  */
  public async getManagedServers<T = computer[]>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetSchoolCentrallyManagedServers/${school}`);
  }
  /**
   * Get locally integrated servers for a school.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Array of local servers.
  */
  public async getLocalServers<T = computer[]>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetSchoolIntegratedServers/${school}`);
  }
  /**
   * Add a local server name for a school.
   * @param {number|string} school - School id.
   * @param {string} name - Server name.
  */
  public async addLocalServer<T = void>(school: number|string, name: string, schoolPrefix: boolean = true): Promise<T> {
    return this.request<T>("post", `/AddSchoolIntegratedServer?schoolId=${school}&newServerName=${schoolPrefix?`${school}S`:''}${name}`);
  }
  /**
   * Delete a server (alias to deleteComputer).
   * @param {number|string} school - School id.
   * @param {string} dn - DN of server.
  */
  public async deleteServer<T = void>(school: number|string, dn: string): Promise<T> {
    return this.deleteComputer<T>(school, dn);
  }
  /**
   * Get distribution lists for a school.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Array of distribution lists.
  */
  public async getDistributionLists<T = group[]>(school: number|string): Promise<T> {
    return this.request<T>("get", `/GetSchoolDL/${school}`);
  }
  /**
   * Get a distribution list's members.
   * @param {number|string} school - School id.
   * @param {string} name - Distribution list name.
   * @returns {Promise<T>} Members of the distribution list.
  */
  public async getDistributionList<T = groupMember[]>(school: number|string, name: string): Promise<T> {
    return this.request<T>("get", `/GetDLMembers/${school}/${name}`);
  }
  /**
   * Create a distribution list.
   * @param {number|string} school - School id.
   * @param {string} name - Name for the distribution list.
  */
  public async addDistributionList<T = void>(school: number|string, name: string, schoolPrefix: boolean = true): Promise<T> {
    return this.request<T>("post", `/CreateDL?schoolId=${school}&dlName=${schoolPrefix?`${school}-dl-`:''}${name}`);
  }
  /**
   * Delete a distribution list.
   * @param {number|string} school - School id.
   * @param {string} name - DL name.
  */
  public async deleteDistributionList<T = void>(school: number|string, name: string): Promise<T> {
    return this.request<T>("post", `/DeleteDL?schoolId=${school}&dlName=${name}`);
  }
  /**
   * Add a member to a distribution list.
   * @param {number|string} school - School id.
   * @param {string} name - DL name.
   * @param {string} memberId - Member TO number / alias.
   * @param {string} memberName - Member display name.
   * @returns {Promise<T>} True on success.
  */
  public async addToDistributionList<T = true>(school: number|string, name: string, memberId: string, memberName: string): Promise<T> {
    return this.request<T>("post", `/AddDLMember?schoolId=${school}&dlName=${name}&memberId=${memberId}&memberDisplayName=${memberName}`);
  }
  /**
   * Remove a member from a distribution list.
   * @param {number|string} school - School id.
   * @param {string} name - DL name.
   * @param {string} memberId - Member TO number / alias.
   * @returns {Promise<T>} True on success.
  */
  public async deleteFromDistributionList<T = true>(school: number|string, name: string, memberId: string): Promise<T> {
    return this.request<T>("post", `/RemoveDLMember?schoolId=${school}&dlName=${name}&memberId=${memberId}`);
  }
  /**
   * Get audit log for a school.
   * @param {number|string} school - School id.
   * @returns {Promise<T>} Audit log entries.
  */
  public async getAuditLog<T = auditLog[]>(school: number|string): Promise<T> {
    return this.request<T>("get", `/Geto365AuditLogBySchool/${school}`);
  }
  /**
   * Get replication status for a server.
   * @param {string} name - Name of server.
   * @returns {Promise<T>} Replication log entries.
  */
  public async getReplicationStatus<T = replicationLog[]>(name: string): Promise<T> {
    return this.request<T>("get", `/QryRodcReplication/${name}`);
  }
  /**
   * Enable or disable a given service (intune/google/etc.) on accounts.
   * @param {number|string} school - School id.
   * @param {"student"|"staff"|"serviceaccount"} [type="student"] - student, staff or serviceaccount.
   * @param {string[]} dnList - Array of DNs to apply changes to.
   * @param {service} service - Service to enable/disable.
   * @param {boolean} [enable=true] - True to set, false to unset.
   * @returns {Promise<T>} Array outcomes.
  */
  public async setService<T = string[]>(school: number|string, type: "student"|"staff"|"serviceaccount" = "student", dnList: string[], service: service, enable: boolean = true): Promise<T> {
    let path = enable ? "/SetO365" : "/UnsetO365";
    let property: service = "intune";
    if (service==="google" && type==="student") {
      path = "/SetO365";
      property = enable ? "add_google_ws" : "remove_google_ws";
    } 
    const data: setServiceRequest = {
      _schoolId: `${school}`,
      _accountType: type,
      _dns: dnList,
      _property: property,
      _value: null
    };
    return this.request<T>("post", path, data);
  }
}

export default eduSTAR;
export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
export type service = "intune" | "google" | "yammer" | "stile" | "lynda" | "o365" | "webex" | "add_google_ws" | "remove_google_ws";
export type dnList = { _login: string, _pass: string }[];
interface passwordReset {
  _login: string;
  _pass: string;
}
export interface passwordResetRequest {
  schoolId: string;
  dn: string;
  newPass: string;
}
export interface passwordsResetRequest {
  _schoolId: string;
  _rows: passwordReset[];
}
export interface passwordsGenerateRequest {
  _schoolId: string;
  _newPass: null;
  _mode: "auto"|"manual";
  _dns: string[];
}
export interface passwordGenerateOutcome {
  _dn: string;
  _firstName: string;
  _lastName: string;
  _login: string;
  _outcome: string;
}
export interface IpInfoResponse {
  _ns_admin_dc: string;
  _ns_admin_dns: string;
  _ns_curric_dc: string;
  _ns_curric_dns: string;
  ipam: {
    CURRIC_IP: string;
    CURRIC_MASK: string;
    ADMIN_IP: string;
    ADMIN_MASK: string;
  }
}
export interface student {
  _login: string;
  _class: string;
  _cn: string;
  _desc: string;
  _disabled: string;
  _displayName: string;
  _dn: string;
  _firstName: string;
  _google: string;
  _intune: string;
  _lastLogon: string;
  _lastName: string;
  _lastPwdResetViaMC: string;
  _lockedOut: string;
  _o365: string;
  _pwdExpired: string;
  _pwdExpires: string;
  _pwdLastSet: string;
  _pwdNeverExpires: string;
  _pwdResetAction: string;
  _pwdResetTech: string;
  _yammer: string;
}
export interface staff {
    _firstName: string;
    _lastName: string;
    _title: string;
    _lynda: string;
    _webex: string;
    _stile: string;
    _alias: string;
    _email: string;
    _currentlyEngaged: boolean;
    _tempEngaged: boolean;
    _phone: string;
    _mobile: string;
    _dn: string;
    _o365: string;
    _intune: string;
    _google: string;
    _yammer: string;
    _status: string;
    _pwdExpiry: string;
    _pwdNeverExpires: boolean;
}
export interface staffResponse {
    _techs: staff[];
    _staff: staff[];
    _tsspTechs: staff[];
}
export interface npsResponse {
	SchoolId: string;
	ModifiedBy: string;
	ServerName: string;
	VirtualDomainName: string;
	VirtualDomainId: string;
	CreationCommand: string;
	CreationCommandResult: string;
	LastUpdate: string;
}
export interface whoAmIResponse {
  _cn: string;
  _dn: string;
  _displayName: string;
  _samAccountName: string;
  _schools: string[];
  _staticLinks: string[];
  RawLogin: string;
  IsLtCoord: boolean;
  IsTeacher: boolean;
  IsTech: boolean;
  IsAdmin: boolean;
  PwdAdminSchools: string[];
  IsSDM: boolean;
  IsSSPAdmin: boolean;
  IsConsoleOperator: boolean;
  SdmRegion: string[];
}
export interface school {
    _isIntegrated: boolean;
    _techs: never[];
    _staff: never[];
    _students: never[];
    _tsspTechs: never[];
    _centralGroups: never[];
    _localGroups: never[];
    _caseComputers: never[];
    _adminWorkstationExceptions: never[];
    _centralExceptions: never[];
    _centralExceptionstoRemove: never[];
    _adminServers: never[];
    _curricServers: never[];
    _rodcs: never[];
    _managedComputers: never[];
    _curricComputers: never[];
    _integratedServers: never[];
    _serviceAccounts: never[];
    _campus: object;
    _npsMapping: {
        SchoolId: string;
        ModifiedBy: string;
        ServerName: string;
        VirtualDomainName: string;
        VirtualDomainId: string;
        CreationCommand: string;
        CreationCommandResult: string;
        LastUpdate: string;
    };
		_screenSaverPolicy: string;
		_gpo: never[];
		_notes: never[];
		_dls: never[];
		_ipam: object;
		_ns_admin_dc: string;
		_ns_admin_dns: string;
		_ns_curric_dc: string;
		_ns_curric_dns: string;
		SchoolId: string;
		SchoolName: string;
    Region: string;
}
export interface group {
  _groupName: string;
  _dn: string;
}
export interface groupMember {
  _firstName: string;
  _lastName: string;
  _login: string;
  _cn: string;
  _dn: string;
  _canDelete: boolean;
  _mail: string;
}
export interface groupsResponse {
  _centralGroups: group[];
  _localGroups: group[];
}
export interface computer {
  _computerName: string;
  _dn: string;
  _adminPWD: string;
  _bitLockerKey: string[];
  _homePage: string;
  _pxePwd: string;
}
export interface serviceAccount {
    _firstName: string;
    _lynda: string;
    _stile: string;
    _lastName: string;
    _login: string;
    _accountType: string;
    _disabled: boolean;
    _dn: string;
    _o365: string;
    _intune: string;
    _google: string;
    _yammer: string;
    _webex: string;
}
export interface computersResponse {
    _caseComputers: computer[],
    _curricComputers: computer[],
}
export interface auditLog {
  _date: string;
  _user: string;
  _message: string;
  _action: string;
  _targetDn: string;
}
export interface replicationLog {
  Partition: string;
  Partner: string;
  LastSyncTime: string;
  Message: string;
  ReplErrors: number;
}
export interface setServiceRequest {
  _schoolId: string;
  _accountType: "student"|"staff"|"serviceaccount";
  _dns: string[];
  _property: service;
  _value: null;
}