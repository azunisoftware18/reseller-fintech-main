"use client";

import { useEffect, useState } from "react";
import { useLogin, useMe } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import { loginSuccess, setUserFromMe } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import LoginForm from "../forms/LoginForm";

export default function LoginClient() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { mutate, isPending } = useLogin();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const { data: meRes, refetch } = useMe();

  // Get geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLocationDenied(false);
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
          setLocationError(err.message);

          if (err.code === err.PERMISSION_DENIED) {
            setLocationDenied(true);
          }

          setLocation({ latitude: null, longitude: null, accuracy: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
      setLocationDenied(true);
      setLocation({ latitude: null, longitude: null, accuracy: null });
    }
  }, []);

  useEffect(() => {
    if (meRes?.data) {
      dispatch(setUserFromMe(meRes.data));
      router.push("/dashboard");
    }
  }, [meRes, dispatch, router]);

  const login = (data, setError) => {
    const payload = {
      ...data,
      latitude: location?.latitude ?? undefined,
      longitude: location?.longitude ?? undefined,
      accuracy: location?.accuracy ?? undefined,
    };

    mutate(payload, {
      onSuccess: (res) => {
        dispatch(loginSuccess(res));
        refetch();
      },
      onError: (err) => {
        const apiError = err?.response?.data;

        if (apiError?.errors?.length) {
          apiError.errors.forEach(({ field, message }) => {
            setError(field, { message });
          });
          return;
        }

        setError("root", {
          message: apiError?.message || err.message || "Login failed",
        });
      },
    });
  };

  return (
    <LoginForm
      login={login}
      isPending={isPending}
      locationError={locationError}
      isLocating={location === null && !locationDenied}
      locationDenied={locationDenied}
    />
  );
}
