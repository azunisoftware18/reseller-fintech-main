"use client";

import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  Shield,
  Building,
  Users,
  Lock,
  MapPin,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";

export default function LoginForm({
  login,
  isPending,
  locationError,
  isLocating,
  locationDenied,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("USER");
  const [showHelp, setShowHelp] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      identifier: "",
      password: "",
      type: "USER",
    },
  });

  const onSubmit = (data) => {
    login(data, setError);
  };

  const handleTabClick = (tabValue) => {
    setActiveTab(tabValue);
    setValue("type", tabValue);
  };

  // Browser-specific instructions
  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("chrome")) {
      return {
        browser: "Chrome",
        steps: [
          "Click on the padlock icon 🔒 in the address bar",
          'Click on "Site settings"',
          'Find "Location" in the permissions list',
          'Change from "Block" to "Allow"',
          "Refresh the page",
        ],
      };
    } else if (userAgent.includes("firefox")) {
      return {
        browser: "Firefox",
        steps: [
          "Click on the padlock icon 🔒 in the address bar",
          'Click on "Connection secure" > "More information"',
          'Go to "Permissions" tab',
          'Uncheck "Block new requests for accessing your location"',
          "Refresh the page",
        ],
      };
    } else if (userAgent.includes("safari")) {
      return {
        browser: "Safari",
        steps: [
          'Click on Safari menu > "Settings for This Website"',
          'Find "Location" in the permissions list',
          'Change from "Deny" to "Allow"',
          "Refresh the page",
        ],
      };
    } else if (userAgent.includes("edge")) {
      return {
        browser: "Edge",
        steps: [
          "Click on the padlock icon 🔒 in the address bar",
          'Click on "Permissions for this site"',
          'Find "Location" in the permissions list',
          'Change from "Block" to "Allow"',
          "Refresh the page",
        ],
      };
    } else {
      return {
        browser: "your browser",
        steps: [
          "Click on the padlock/info icon in the address bar",
          "Look for location permissions in site settings",
          'Change from "Block" to "Allow"',
          "Refresh the page",
        ],
      };
    }
  };

  const instructions = getBrowserInstructions();

  return (
    <div className="bg-card border border-border rounded-lg-border shadow-xl w-full max-w-md overflow-hidden">
      <div className="bg-primary px-6 py-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-foreground/20 rounded-full">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">
            Welcome Back
          </h2>
          <p className="text-primary-foreground/90 text-sm">
            Sign in to your account to continue
          </p>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex">
          <button
            type="button"
            onClick={() => handleTabClick("USER")}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === "USER"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              User
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("EMPLOYEE")}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === "EMPLOYEE"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building className="h-4 w-4" />
              Employee
            </div>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Location Status Indicator */}
        <div
          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-border text-xs mb-4 ${
            isLocating
              ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
              : locationDenied
                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                : locationError
                  ? "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                  : "bg-green-500/10 text-green-600 border border-green-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {isLocating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Detecting your location...</span>
              </>
            ) : locationDenied ? (
              <>
                <AlertCircle className="h-3 w-3" />
                <span>Location access denied. Login is disabled.</span>
              </>
            ) : locationError ? (
              <>
                <MapPin className="h-3 w-3" />
                <span>Location unavailable: {locationError}</span>
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3" />
                <span>Location captured successfully</span>
              </>
            )}
          </div>

          {locationDenied && (
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-red-600 hover:text-red-700 transition-colors"
              title="How to enable location"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Help Instructions for enabling location */}
        {showHelp && locationDenied && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How to enable location access in {instructions.browser}:
            </h4>
            <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
              After enabling location, please refresh the page to continue.
            </p>
          </div>
        )}

        {errors?.root && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-border mb-4">
            <p className="text-sm font-medium text-red-500 leading-tight">
              {errors.root.message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            label={activeTab === "EMPLOYEE" ? "Employee ID" : "User ID"}
            name="identifier"
            register={register}
            required
            disabled={isPending || isLocating || locationDenied}
            autoComplete="username"
            placeholder={
              activeTab === "EMPLOYEE"
                ? "Enter your Employee ID"
                : "Enter your User ID"
            }
            error={errors.identifier}
          />

          <InputField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            register={register}
            required
            disabled={isPending || isLocating || locationDenied}
            autoComplete="current-password"
            placeholder="Enter your password"
            rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            onRightIconClick={() => setShowPassword((prev) => !prev)}
            error={errors.password}
          />

          <select {...register("type")} id="type" className="hidden">
            <option value="USER">User</option>
            <option value="EMPLOYEE">Employee</option>
          </select>

          <Button
            type="submit"
            disabled={isPending || isLocating || locationDenied}
            loading={isPending}
            className="w-full"
          >
            {isPending
              ? "Signing in..."
              : locationDenied
                ? "Location access required"
                : isLocating
                  ? "Getting location..."
                  : `Sign In as ${activeTab === "EMPLOYEE" ? "Employee" : "User"}`}
          </Button>
        </form>

        {locationDenied && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-border">
            <p className="text-xs text-yellow-600 text-center">
              💡 <strong>Tip:</strong> Click the padlock icon 🔒 in your
              browser's address bar, change location permissions from "Block" to
              "Allow", then refresh the page.
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border text-center">
          <div className="flex items-center justify-center text-muted-foreground mb-2">
            <Lock className="h-3 w-3 mr-1" />
            <p className="text-xs">Your credentials are secure</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {activeTab === "EMPLOYEE"
              ? "Use your Employee ID to login"
              : "Use your User ID to login"}
          </p>
        </div>
      </div>
    </div>
  );
}
