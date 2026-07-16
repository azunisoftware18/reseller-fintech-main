import {
  employeeActivatedTemplate,
  employeeCreatedTemplate,
  employeeInactiveTemplate,
  employeeSuspendedTemplate,
} from './employees.template.js';
import { domainCreatedTemplate } from './tenantDomain.template.js';

import {
  userActivatedTemplate,
  userCreatedTemplate,
  userInactiveTemplate,
  userSuspendedTemplate,
  userDeletedTemplate,
} from './users.template.js';

export const MailTemplates = {
  employeeCreated: employeeCreatedTemplate,
  employeeActivated: employeeActivatedTemplate,
  employeeInactive: employeeInactiveTemplate,
  employeeSuspended: employeeSuspendedTemplate,

  //user
  usersCreated: userCreatedTemplate,
  usersActivated: userActivatedTemplate,
  usersInactive: userInactiveTemplate,
  usersSuspended: userSuspendedTemplate,
  usersDeleted: userDeletedTemplate,

  tenantDomainCreated: domainCreatedTemplate,
};
