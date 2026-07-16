"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  AlertCircle,
  Upload,
  FileText,
  X,
  User,
  MapPin,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Shield,
  Camera,
  FileDigit,
} from "lucide-react";
import Button from "@/components/ui/Button";
import SelectField from "@/components/ui/SelectField";
import { toast } from "@/lib/toast";
import { useStates, useCitiesByState } from "@/hooks/useStateCity";

const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

const STEPS = [
  {
    id: 1,
    title: "Identity Documents",
    icon: CreditCard,
    fields: ["panNumber", "aadhaarNumber"],
  },
  {
    id: 2,
    title: "Personal Details",
    icon: User,
    fields: ["firstName", "lastName", "fatherName", "dob", "gender"],
  },
  {
    id: 3,
    title: "Address",
    icon: MapPin,
    fields: ["address", "pinCode", "stateId", "cityId"],
  },
  { id: 4, title: "Document Upload", icon: Upload, fields: ["documents"] },
];

const UPLOAD_DOCUMENTS = [
  {
    key: "userPhoto",
    label: "User Photo",
    required: true,
    accept: "image/*",
    maxSize: "150KB",
    icon: Camera,
    isPhoto: true,
    docType: "USER_PHOTO",
    needsDocNumber: false,
  },
  {
    key: "panFile",
    label: "PAN File",
    required: true,
    accept: "image/*",
    maxSize: "150KB",
    icon: FileDigit,
    docType: "PAN",
    needsDocNumber: true,
    docNumberField: "panNumber",
    docNumberLabel: "PAN Number",
  },
  {
    key: "aadhaarFront",
    label: "Aadhaar Front",
    required: true,
    accept: "image/*",
    maxSize: "150KB",
    icon: FileDigit,
    docType: "AADHAAR_FRONT",
    needsDocNumber: true,
    docNumberField: "aadhaarNumber",
    docNumberLabel: "Aadhaar Number",
  },
  {
    key: "aadhaarBack",
    label: "Aadhaar Back",
    required: true,
    accept: "image/*",
    maxSize: "150KB",
    icon: FileDigit,
    docType: "AADHAAR_BACK",
    needsDocNumber: false,
  },
  {
    key: "addressProof",
    label: "Address Proof",
    required: true,
    accept: "image/*",
    maxSize: "150KB",
    icon: FileText,
    docType: "ADDRESS_PROOF",
    needsDocNumber: true,
    docNumberLabel: "Document Number",
    placeholder: "Enter document number",
  },
];

export default function KycForm({
  userId,
  onSubmit,
  isPending,
  isResubmit = false,
  kycId = null,
  initialData = null,
  canVerifyPan = false,
  canVerifyAadhaar = false,
  onVerifyPan = null,
  onVerifyAadhaar = null,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState({
    pan: { verified: false, data: null },
    aadhaar: { verified: false, data: null },
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    userPhoto: null,
    panFile: null,
    aadhaarFront: null,
    aadhaarBack: null,
    addressProof: null,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
    setError,
    clearErrors,
    control,
    getValues,
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      panNumber: "",
      aadhaarNumber: "",
      firstName: "",
      lastName: "",
      fatherName: "",
      dob: "",
      gender: "MALE",
      address: "",
      pinCode: "",
      stateId: "",
      cityId: "",
      addressProofNumber: "",
      documents: [
        {
          documentType: "PAN",
          documentNumber: "",
          documentUrl: "",
          documentFile: null,
        },
        {
          documentType: "AADHAAR_FRONT",
          documentNumber: "",
          documentUrl: "",
          documentFile: null,
        },
        {
          documentType: "AADHAAR_BACK",
          documentNumber: "",
          documentUrl: "",
          documentFile: null,
        },
        {
          documentType: "ADDRESS_PROOF",
          documentNumber: "",
          documentUrl: "",
          documentFile: null,
        },
        {
          documentType: "USER_PHOTO",
          documentNumber: "USER_PHOTO",
          documentUrl: "",
          documentFile: null,
        },
      ],
      photo: null,
    },
  });

  // Auto-fill form with initialData for resubmit
  useEffect(() => {
    if (initialData && isResubmit) {
      const docs = initialData.documents || [];

      const findDoc = (type) => docs.find((d) => d.documentType === type);

      const panDoc = findDoc("PAN");
      const aadhaarFrontDoc = findDoc("AADHAAR_FRONT");
      const aadhaarBackDoc = findDoc("AADHAAR_BACK");
      const addressProofDoc = findDoc("ADDRESS_PROOF");
      const userPhotoDoc = findDoc("USER_PHOTO");

      // Format aadhaar with dashes for display
      const rawAadhaar = aadhaarFrontDoc?.documentNumber || "";
      const formattedAadhaar =
        rawAadhaar.length === 12
          ? `${rawAadhaar.slice(0, 4)}-${rawAadhaar.slice(4, 8)}-${rawAadhaar.slice(8, 12)}`
          : rawAadhaar;

      // Parse ISO date to YYYY-MM-DD for HTML date input
      const rawDob = initialData.personalInfo?.dob;
      const formattedDob = rawDob
        ? new Date(rawDob).toISOString().split("T")[0]
        : "";

      reset({
        panNumber: panDoc?.documentNumber || "",
        aadhaarNumber: formattedAadhaar,
        firstName: initialData.personalInfo?.firstName || "",
        lastName: initialData.personalInfo?.lastName || "",
        fatherName: initialData.personalInfo?.fatherName || "",
        dob: formattedDob,
        gender: initialData.personalInfo?.gender || "MALE",
        address: initialData.address?.address || "",
        pinCode: initialData.address?.pinCode || "",
        stateId: initialData.address?.stateId || "",
        cityId: initialData.address?.cityId || "",
        addressProofNumber: addressProofDoc?.documentNumber || "",
        documents: [
          {
            documentType: "PAN",
            documentNumber: panDoc?.documentNumber || "",
            documentUrl: panDoc?.documentUrl || "",
            documentFile: null,
          },
          {
            documentType: "AADHAAR_FRONT",
            documentNumber: aadhaarFrontDoc?.documentNumber || "",
            documentUrl: aadhaarFrontDoc?.documentUrl || "",
            documentFile: null,
          },
          {
            documentType: "AADHAAR_BACK",
            documentNumber: aadhaarBackDoc?.documentNumber || "",
            documentUrl: aadhaarBackDoc?.documentUrl || "",
            documentFile: null,
          },
          {
            documentType: "ADDRESS_PROOF",
            documentNumber: addressProofDoc?.documentNumber || "",
            documentUrl: addressProofDoc?.documentUrl || "",
            documentFile: null,
          },
          {
            documentType: "USER_PHOTO",
            documentNumber: "USER_PHOTO",
            documentUrl: userPhotoDoc?.documentUrl || "",
            documentFile: null,
          },
        ],
      });

      setUploadedFiles({
        userPhoto: userPhotoDoc?.documentUrl || null,
        panFile: panDoc?.documentUrl || null,
        aadhaarFront: aadhaarFrontDoc?.documentUrl || null,
        aadhaarBack: aadhaarBackDoc?.documentUrl || null,
        addressProof: addressProofDoc?.documentUrl || null,
      });
    }
  }, [initialData, isResubmit, reset]);

  const panNumber = watch("panNumber");
  const aadhaarNumber = watch("aadhaarNumber");
  const selectedStateId = watch("stateId");

  const { data: statesData, isLoading: statesLoading } = useStates();
  const selectedStateCode =
    statesData?.data?.find((s) => s.id === selectedStateId)?.stateCode || "";
  const { data: citiesData, isLoading: citiesLoading } =
    useCitiesByState(selectedStateCode);

  const stateOptions =
    statesData?.data?.map((state) => ({
      label: state.stateName || state.name || state.label,
      value: state.id,
    })) || [];

  const cityOptions =
    citiesData?.data?.map((city) => ({
      label: city.cityName || city.name || city.label,
      value: city.id,
    })) || [];

  // Only clear city when state actually changes (not on initial load)
  useEffect(() => {
    if (selectedStateId && selectedStateId !== initialData?.address?.stateId) {
      setValue("cityId", "", { shouldValidate: false });
    }
  }, [selectedStateId, setValue, initialData?.address?.stateId]);

  useEffect(() => {
    if (errors?.root) {
      const timer = setTimeout(() => clearErrors("root"), 5000);
      return () => clearTimeout(timer);
    }
  }, [errors?.root, clearErrors]);

  const formatPan = (val) =>
    val
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
  const formatAadhaar = (val) => {
    const digits = val?.replace(/\D/g, "") || "";
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  };

  const handleVerificationSuccess = useCallback(
    (type, data) => {
      setVerificationStatus((prev) => ({
        ...prev,
        [type]: { verified: true, data },
      }));

      if (type === "aadhaar" && data) {
        const fullName = data?.name || "";
        const nameParts = fullName.trim().split(" ");
        setValue("firstName", nameParts[0] || "", { shouldValidate: true });
        setValue("lastName", nameParts.slice(1).join(" ") || "", {
          shouldValidate: true,
        });
        setValue("fatherName", data?.care_of || "", { shouldValidate: true });

        if (data?.dob) {
          const [day, month, year] = data.dob.split("-");
          setValue("dob", `${year}-${month}-${day}`, { shouldValidate: true });
        }

        const genderMap = { M: "MALE", F: "FEMALE", O: "OTHER" };
        setValue("gender", genderMap[data?.gender] || "MALE", {
          shouldValidate: true,
        });
        setValue("address", data?.address || "", { shouldValidate: true });
        setValue("pinCode", data?.split_address?.pincode || "", {
          shouldValidate: true,
        });

        if (data?.photo_link) {
          setValue("aadhaarPhoto", data.photo_link, { shouldValidate: false });
          setUploadedFiles((prev) => ({ ...prev, userPhoto: data.photo_link }));
        }
        toast.success("Aadhaar verified! Details auto-filled.");
      }

      if (type === "pan" && data) {
        const fullName = data?.name || "";
        const nameParts = fullName.split(" ");
        setValue("firstName", nameParts[0] || "", { shouldValidate: true });
        setValue("lastName", nameParts.slice(1).join(" ") || "", {
          shouldValidate: true,
        });
        toast.success("PAN verified! Name auto-filled.");
      }
    },
    [setValue],
  );

  const validateStep = async (step) => {
    const currentStepData = STEPS.find((s) => s.id === step);
    if (!currentStepData) return false;
    const result = await trigger(currentStepData.fields);
    return result;
  };

  const handleNext = async (e) => {
    if (e) e.preventDefault();
    clearErrors();
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error("Please fill all required fields correctly");
    }
  };

  const handleBack = (e) => {
    if (e) e.preventDefault();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = async (step) => {
    if (step < currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  const updateDocument = (index, field, value) => {
    const currentDocs = getValues("documents");
    const updated = [...currentDocs];
    updated[index] = { ...updated[index], [field]: value };
    setValue("documents", updated, { shouldValidate: true });
  };

  const getDocumentIndex = (docType) => {
    const docs = getValues("documents");
    return docs.findIndex((d) => d.documentType === docType);
  };

  const handleFileUpload = (key, file, docType) => {
    if (!file) return;

    const fakeUrl = URL.createObjectURL(file);
    setUploadedFiles((prev) => ({ ...prev, [key]: fakeUrl }));

    const docIndex = getDocumentIndex(docType);
    if (docIndex >= 0) {
      const currentDocs = getValues("documents");
      const updatedDocs = [...currentDocs];

      updatedDocs[docIndex] = {
        ...updatedDocs[docIndex],
        documentUrl: fakeUrl,
        documentFile: file,
      };

      // Auto-fill document number if empty
      if (!updatedDocs[docIndex].documentNumber) {
        if (docType === "PAN") {
          updatedDocs[docIndex].documentNumber = formatPan(panNumber);
        } else if (docType === "AADHAAR_FRONT" || docType === "AADHAAR_BACK") {
          updatedDocs[docIndex].documentNumber =
            aadhaarNumber?.replace(/\D/g, "") || "";
        } else if (docType === "USER_PHOTO") {
          updatedDocs[docIndex].documentNumber = "USER_PHOTO";
        }
      }

      setValue("documents", updatedDocs, { shouldValidate: true });

      if (key === "userPhoto") {
        setValue("photo", file, { shouldValidate: true });
      }
    }
  };

  const handleDocNumberChange = (docType, value) => {
    const docIndex = getDocumentIndex(docType);
    if (docIndex >= 0) {
      updateDocument(docIndex, "documentNumber", value);
    }
  };

  const removeFile = (key, docType) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: null }));

    const docIndex = getDocumentIndex(docType);
    if (docIndex >= 0) {
      const currentDocs = getValues("documents");
      const updatedDocs = [...currentDocs];
      updatedDocs[docIndex] = {
        ...updatedDocs[docIndex],
        documentUrl: "",
        documentFile: null,
      };
      setValue("documents", updatedDocs, { shouldValidate: true });
    }

    if (key === "userPhoto") {
      setValue("photo", null, { shouldValidate: true });
    }
  };

  const onFormSubmit = async (data) => {
    clearErrors();

    // Validate all steps
    for (let step = 1; step <= 4; step++) {
      const isValid = await validateStep(step);
      if (!isValid) {
        setCurrentStep(step);
        setError("root", {
          type: "manual",
          message: `Please complete Step ${step} correctly`,
        });
        return;
      }
    }

    // Prepare documents with proper numbers
    const updatedDocs = data.documents.map((doc) => {
      if (doc.documentType === "PAN") {
        return {
          ...doc,
          documentNumber: formatPan(data.panNumber) || doc.documentNumber,
        };
      }
      if (
        doc.documentType === "AADHAAR_FRONT" ||
        doc.documentType === "AADHAAR_BACK"
      ) {
        return {
          ...doc,
          documentNumber:
            data.aadhaarNumber?.replace(/\D/g, "") || doc.documentNumber || "",
        };
      }
      if (doc.documentType === "ADDRESS_PROOF") {
        return {
          ...doc,
          documentNumber:
            data.addressProofNumber || doc.documentNumber || "ADDRESS_PROOF",
        };
      }
      if (doc.documentType === "USER_PHOTO") {
        return { ...doc, documentNumber: "USER_PHOTO" };
      }
      return doc;
    });

    // Filter valid docs
    const validDocs = updatedDocs.filter(
      (doc) => doc.documentType && (doc.documentFile || doc.documentUrl),
    );

    // Check required docs
    const requiredDocs = [
      "USER_PHOTO",
      "PAN",
      "AADHAAR_FRONT",
      "AADHAAR_BACK",
      "ADDRESS_PROOF",
    ];
    const missingFiles = requiredDocs.filter((type) => {
      const doc = validDocs.find((d) => d.documentType === type);
      return !doc?.documentFile && !doc?.documentUrl;
    });

    if (missingFiles.length > 0) {
      setError("root", {
        type: "manual",
        message: `Please upload all required documents: ${missingFiles.join(", ").replace(/_/g, " ")}`,
      });
      setCurrentStep(4);
      return;
    }

    // Check document numbers
    const emptyDocNumbers = validDocs.filter(
      (d) => !d.documentNumber || d.documentNumber.trim() === "",
    );
    if (emptyDocNumbers.length > 0) {
      setError("root", {
        type: "manual",
        message: `Document numbers required for: ${emptyDocNumbers.map((d) => d.documentType).join(", ")}`,
      });
      setCurrentStep(4);
      return;
    }

    // 🔥 ALWAYS use FormData — no JSON fallback
    const formData = new FormData();

    // Build metadata for each doc
    const documentMetadata = validDocs.map((doc) => ({
      documentType: doc.documentType,
      documentNumber: doc.documentNumber,
      ...(doc.documentUrl && !doc.documentFile
        ? { documentUrl: doc.documentUrl }
        : {}),
    }));

    // Append JSON data fields individually (so multer/express can parse them)
    formData.append("userId", userId);
    if (isResubmit && kycId) {
      formData.append("kycId", kycId);
    }

    // Personal info
    formData.append(
      "personalInfo",
      JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        fatherName: data.fatherName || "",
        dob: data.dob,
        gender: data.gender,
      }),
    );

    // Address
    formData.append(
      "address",
      JSON.stringify({
        address: data.address,
        pinCode: data.pinCode,
        stateId: data.stateId,
        cityId: data.cityId,
      }),
    );

    // Documents metadata
    formData.append("documents", JSON.stringify(documentMetadata));

    // 🔥 Append actual files (not blob URLs)
    validDocs.forEach((doc) => {
      if (doc.documentFile) {
        formData.append("documents", doc.documentFile);
      }
    });

    console.log("Sending FormData with:", {
      userId,
      kycId: isResubmit ? kycId : null,
      filesCount: validDocs.filter((d) => d.documentFile).length,
      metadataCount: documentMetadata.length,
    });

    onSubmit(formData, setError);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-muted">
              <p className="text-sm flex items-center text-foreground">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Start with identity verification. You can verify via API or
                enter details manually.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  PAN Number <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    {...register("panNumber", {
                      required: "PAN is required",
                      pattern: {
                        value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                        message: "Invalid PAN format (ABCDE1234F)",
                      },
                    })}
                    value={formatPan(panNumber)}
                    onChange={(e) =>
                      setValue("panNumber", formatPan(e.target.value), {
                        shouldValidate: true,
                      })
                    }
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className={`w-full pl-10 pr-4 py-2 border rounded bg-background text-foreground placeholder:text-muted-foreground ${errors.panNumber ? "border-error" : "border-input"}`}
                  />
                </div>
                {errors.panNumber && (
                  <p className="text-error text-xs">
                    {errors.panNumber.message}
                  </p>
                )}

                {canVerifyPan && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onVerifyPan?.(formatPan(panNumber), (data) =>
                        handleVerificationSuccess("pan", data),
                      )
                    }
                    disabled={
                      !panNumber ||
                      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formatPan(panNumber))
                    }
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verify PAN
                  </Button>
                )}
                {verificationStatus.pan.verified && (
                  <span className="text-success text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> Verified
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Aadhaar Number <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    {...register("aadhaarNumber", {
                      required: "Aadhaar is required",
                      pattern: {
                        value: /^\d{4}-\d{4}-\d{4}$/,
                        message: "Invalid Aadhaar format (1234-5678-9012)",
                      },
                    })}
                    value={formatAadhaar(aadhaarNumber)}
                    onChange={(e) =>
                      setValue("aadhaarNumber", formatAadhaar(e.target.value), {
                        shouldValidate: true,
                      })
                    }
                    placeholder="1234-5678-9012"
                    maxLength={14}
                    className={`w-full pl-10 pr-4 py-2 border rounded bg-background text-foreground placeholder:text-muted-foreground ${errors.aadhaarNumber ? "border-error" : "border-input"}`}
                  />
                </div>
                {errors.aadhaarNumber && (
                  <p className="text-error text-xs">
                    {errors.aadhaarNumber.message}
                  </p>
                )}

                {canVerifyAadhaar && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onVerifyAadhaar?.(
                        aadhaarNumber.replace(/\D/g, ""),
                        (data) => handleVerificationSuccess("aadhaar", data),
                      )
                    }
                    disabled={
                      !aadhaarNumber ||
                      !/^\d{4}-\d{4}-\d{4}$/.test(aadhaarNumber)
                    }
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Aadhaar
                  </Button>
                )}
                {verificationStatus.aadhaar.verified && (
                  <span className="text-success text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  First Name <span className="text-error">*</span>
                </label>
                <input
                  {...register("firstName", {
                    required: "First name is required",
                    pattern: {
                      value: /^[A-Za-z\s]{2,50}$/,
                      message: "Invalid name (letters only)",
                    },
                  })}
                  className={`w-full px-4 py-2 border rounded bg-background text-foreground placeholder:text-muted-foreground ${errors.firstName ? "border-error" : "border-input"}`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-error text-xs mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Last Name <span className="text-error">*</span>
                </label>
                <input
                  {...register("lastName", {
                    required: "Last name is required",
                    pattern: {
                      value: /^[A-Za-z\s]{2,50}$/,
                      message: "Invalid name (letters only)",
                    },
                  })}
                  className={`w-full px-4 py-2 border rounded bg-background text-foreground placeholder:text-muted-foreground ${errors.lastName ? "border-error" : "border-input"}`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-error text-xs mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Father&apos;s Name
                </label>
                <input
                  {...register("fatherName")}
                  className="w-full px-4 py-2 border rounded bg-background text-foreground placeholder:text-muted-foreground border-input"
                  placeholder="Enter father's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Date of Birth <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  {...register("dob", {
                    required: "Date of birth is required",
                    validate: (value) => {
                      const dob = new Date(value);
                      const today = new Date();
                      const age = today.getFullYear() - dob.getFullYear();
                      return age >= 18 || "You must be at least 18 years old";
                    },
                  })}
                  className={`w-full px-4 py-2 border rounded bg-background text-foreground ${errors.dob ? "border-error" : "border-input"}`}
                />
                {errors.dob && (
                  <p className="text-error text-xs mt-1">
                    {errors.dob.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-3 text-foreground">
                  Gender <span className="text-error">*</span>
                </label>
                <div className="flex gap-4">
                  {GENDER_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={option.value}
                        {...register("gender", { required: true })}
                        className="w-4 h-4 text-primary accent-primary"
                      />
                      <span className="text-muted-foreground">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Complete Address <span className="text-error">*</span>
                </label>
                <textarea
                  {...register("address", { required: "Address is required" })}
                  rows={3}
                  className={`w-full p-3 rounded border bg-background text-foreground placeholder:text-muted-foreground ${errors.address ? "border-error" : "border-input"}`}
                  placeholder="Enter full address"
                />
                {errors.address && (
                  <p className="text-error text-xs mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    PIN Code <span className="text-error">*</span>
                  </label>
                  <input
                    {...register("pinCode", {
                      required: "PIN code is required",
                      pattern: {
                        value: /^\d{6}$/,
                        message: "PIN must be 6 digits",
                      },
                    })}
                    value={watch("pinCode")}
                    onChange={(e) =>
                      setValue(
                        "pinCode",
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                        { shouldValidate: true },
                      )
                    }
                    maxLength={6}
                    className={`w-full px-4 py-2 border rounded bg-background text-foreground placeholder:text-muted-foreground ${errors.pinCode ? "border-error" : "border-input"}`}
                    placeholder="6-digit PIN"
                  />
                  {errors.pinCode && (
                    <p className="text-error text-xs mt-1">
                      {errors.pinCode.message}
                    </p>
                  )}
                </div>

                <Controller
                  name="stateId"
                  control={control}
                  rules={{ required: "State is required" }}
                  render={({ field }) => (
                    <SelectField
                      label="State *"
                      options={stateOptions}
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      error={errors.stateId?.message}
                      loading={statesLoading}
                      placeholder={
                        statesLoading ? "Loading states..." : "Select State"
                      }
                    />
                  )}
                />

                <Controller
                  name="cityId"
                  control={control}
                  rules={{ required: "City is required" }}
                  render={({ field }) => (
                    <SelectField
                      label="City *"
                      options={cityOptions}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.cityId?.message}
                      disabled={!selectedStateId}
                      loading={citiesLoading}
                      placeholder={
                        !selectedStateId
                          ? "Select state first"
                          : citiesLoading
                            ? "Loading cities..."
                            : "Select City"
                      }
                    />
                  )}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {UPLOAD_DOCUMENTS.map((doc) => {
                const Icon = doc.icon;
                const uploadedFile = uploadedFiles[doc.key];

                return (
                  <div key={doc.key} className="space-y-3">
                    <label className="block text-sm font-medium text-muted-foreground">
                      {doc.label}{" "}
                      {doc.required && <span className="text-error">*</span>}
                    </label>

                    {doc.needsDocNumber && (
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder={doc.docNumberLabel || "Document Number"}
                          value={
                            doc.docNumberField
                              ? watch(doc.docNumberField) || ""
                              : watch("addressProofNumber") || ""
                          }
                          onChange={(e) => {
                            if (doc.docNumberField) {
                              setValue(doc.docNumberField, e.target.value, {
                                shouldValidate: true,
                              });
                            } else {
                              setValue("addressProofNumber", e.target.value, {
                                shouldValidate: true,
                              });
                            }
                            handleDocNumberChange(doc.docType, e.target.value);
                          }}
                          className="w-full px-3 py-2 text-sm border rounded bg-background text-foreground placeholder:text-muted-foreground border-input focus:border-primary focus:outline-none"
                        />
                      </div>
                    )}

                    {uploadedFile ? (
                      <div className="relative group">
                        <div
                          className={`border-2 border-dashed border-success rounded-lg p-4 bg-muted ${doc.isPhoto ? "h-40" : "h-32"} flex flex-col items-center justify-center`}
                        >
                          {doc.isPhoto ? (
                            <img
                              src={uploadedFile}
                              alt={doc.label}
                              className="h-full w-full object-contain rounded"
                            />
                          ) : (
                            <>
                              <FileText className="h-8 w-8 text-success mb-2" />
                              <span className="text-sm text-success font-medium">
                                File uploaded
                              </span>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(doc.key, doc.docType)}
                          className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`block border-2 border-dashed border-border rounded-lg p-4 hover:border-primary hover:bg-primary/10 transition-all ${doc.isPhoto ? "h-40" : "h-32"}`}
                      >
                        <label className="h-full flex flex-col items-center justify-center text-center cursor-pointer">
                          <Icon className="h-8 w-8 text-muted-foreground mb-3" />
                          <p className="text-sm text-primary font-medium mb-1">
                            Click to upload
                          </p>
                          <p className="text-xs text-muted-foreground">
                            or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG or JPG (max {doc.maxSize})
                          </p>
                          <input
                            type="file"
                            accept={doc.accept}
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(
                                doc.key,
                                e.target.files[0],
                                doc.docType,
                              )
                            }
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl text-foreground">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-foreground">KYC Verification</h2>
        <p className="text-muted-foreground mt-2">
          {isResubmit
            ? "Please correct your information and resubmit"
            : "Complete your KYC to access all features"}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            const isClickable =
              step.id <= currentStep || completedSteps.includes(step.id - 1);

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => isClickable && goToStep(step.id)}
                    disabled={!isClickable}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-success text-primary-foreground"
                        : isActive
                          ? "bg-primary text-primary-foreground ring-4 ring-ring"
                          : "bg-muted text-muted-foreground"
                    } ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={24} />
                    ) : (
                      <Icon size={24} />
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs font-semibold block ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {step.title}
                    </span>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${isCompleted ? "bg-success" : "bg-muted"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {errors?.root && (
        <div className="mb-6 rounded-lg border border-error bg-muted p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-error" />
            <p className="text-sm text-error">{errors.root.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="rounded-lg shadow border border-border bg-card p-6">
          {renderStepContent()}
        </div>

        <div className="flex justify-between items-center pt-4">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                icon={ChevronLeft}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                icon={ChevronRight}
                iconPosition="right"
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="submit"
                loading={isPending}
                disabled={isPending}
                className="bg-success hover:bg-primary/90 text-primary-foreground"
              >
                {isResubmit ? "Resubmit KYC" : "Submit KYC"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
