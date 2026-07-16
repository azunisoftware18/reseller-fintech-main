import { createSlice } from "@reduxjs/toolkit";

const serviceProviderSlice = createSlice({
  name: "serviceProvider",
  initialState: {
    providers: [],
    selectedProvider: null,
    providerFeatures: [],
  },
  reducers: {
    // PROVIDERS
    setServiceProviders(state, action) {
      state.providers = action.payload;
    },
    setSelectedServiceProvider(state, action) {
      state.selectedProvider = action.payload;
    },
    clearSelectedServiceProvider(state) {
      state.selectedProvider = null;
      state.providerFeatures = [];
    },

    // PROVIDER FEATURES
    setServiceProviderFeatures(state, action) {
      state.providerFeatures = action.payload;
    },
    clearServiceProviderFeatures(state) {
      state.providerFeatures = [];
    },
  },
});

export const {
  setServiceProviders,
  setSelectedServiceProvider,
  clearSelectedServiceProvider,
  setServiceProviderFeatures,
  clearServiceProviderFeatures,
} = serviceProviderSlice.actions;

export default serviceProviderSlice.reducer;
