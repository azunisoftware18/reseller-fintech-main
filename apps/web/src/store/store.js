import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import tenantReducer from "./tenantSlice";
import userReducer from "./userSlice";
import serverDetailReducer from "./serverDetailSlice";
import tenantDomainReducer from "./tenantDomainSlice";
import smtpConfigReducer from "./smtpConfigSlice";
import tenantWebsiteReducer from "./tenantWebsiteSlice";
import tenantSocialMediaReducer from "./tenantSocialMediaSlice";
import departmentReducer from "./departmentSlice";
import employeeReducer from "./employeeSlice";
import permissionReducer from "./permissionSlice";
import roleReducer from "./roleSlice";
import platformServiceReducer from "./platformServiceSlice";
import serviceProviderReducer from "./serviceProviderSlice";
import tenantServiceReducer from "./tenantServiceSlice";
import fundTransactionReducer from "./fundTransactionSlice";
import rechargeReducer from "./rechargeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    user: userReducer,
    serverDetail: serverDetailReducer,
    tenantDomain: tenantDomainReducer,
    smtpConfig: smtpConfigReducer,
    tenantWebsite: tenantWebsiteReducer,
    tenantSocialMedia: tenantSocialMediaReducer,
    department: departmentReducer,
    employee: employeeReducer,
    permission: permissionReducer,
    role: roleReducer,
    platformService: platformServiceReducer,
    serviceProvider: serviceProviderReducer,
    tenantService: tenantServiceReducer,
    fundRequest: fundTransactionReducer,
    recharge: rechargeReducer,
  },
});
