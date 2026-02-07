import { configureStore } from '@reduxjs/toolkit';

// Import your slices here
// import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    // Add your reducers here
    // auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
