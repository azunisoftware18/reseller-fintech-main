import { createSlice } from "@reduxjs/toolkit";

const platformServiceSlice = createSlice({
  name: "platformService",
  initialState: {
    services: [],
    selectedService: null,

    features: [], // selected service features
    providers: [], // assigned providers
  },
  reducers: {
    //  SERVICES
    setPlatformServices(state, action) {
      state.services = action.payload;
    },
    setSelectedPlatformService(state, action) {
      state.selectedService = action.payload;
    },
    clearSelectedPlatformService(state) {
      state.selectedService = null;
      state.features = [];
      state.providers = [];
    },

    //  FEATURES
    setPlatformServiceFeatures(state, action) {
      state.features = action.payload;
    },
    clearPlatformServiceFeatures(state) {
      state.features = [];
    },

    //  PROVIDERS (mapping)
    setPlatformServiceProviders(state, action) {
      state.providers = action.payload;
    },
    clearPlatformServiceProviders(state) {
      state.providers = [];
    },
  },
});

export const {
  setPlatformServices,
  setSelectedPlatformService,
  clearSelectedPlatformService,
  setPlatformServiceFeatures,
  clearPlatformServiceFeatures,
  setPlatformServiceProviders,
  clearPlatformServiceProviders,
} = platformServiceSlice.actions;

export default platformServiceSlice.reducer;
