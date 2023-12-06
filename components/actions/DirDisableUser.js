import enableUser from './DirEnableUser.js';
export default async function disableUser(execute = false, act, template, connections) {
    return enableUser(execute, act, template, connections, true);
}
