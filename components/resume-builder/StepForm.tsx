"use client";
import React, { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from "@/components/ui/card";

import { FormValues } from './types';
import { steps } from './schema';
import { NavigationButtons } from './components/NavigationButtons';
import { CareerObjectiveStep } from './form-steps/CareerObjectiveStep';
import { PersonalInfoStep, WorkExperienceStep, EducationStep, SkillsStep, ProjectsStep, LanguagesStep, CertificationsStep} from './form-steps';

export default function StepForm() {
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(steps[step].schema),
    defaultValues: {
      personalDetails: {
        fullName: session?.user?.name || "",
        email: session?.user?.email || "",
        phone: "",
        linkedin: "",
        github: "",
        location: ""
      },
      objective: "",
      workExperience: [{
        jobTitle: "",
        companyName: "",
        location: "",
        startDate: "",
        endDate: "",
        description: ""
      }],
      education: [{
        degree: "",
        institution: "",
        location: "",
        startDate: "",
        endDate: "",
        grade: ""
      }],
      skills: [{
        skill: "",
        proficiency: "Beginner"
      }],
      projects: [{
        projectName: "",
        description: "",
        link: ""
      }],
      languages: [{
        language: "",
        proficiency: "Basic"
      }],
      certifications: [{
        certificationName: "",
        issuingOrganization: "",
        issueDate: ""
      }]
    }
  });

  const onSubmit = async (data: FormValues) => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = session?.user?.email;
      if (!userId) {
        throw new Error("Please sign in to save your resume");
      }
      
      const resumeId = `resume_${new Date().getTime()}`;
      const docRef = doc(db, `users/${userId}/resumes/${resumeId}`);

      await setDoc(docRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Show success message or redirect
      alert("Resume saved successfully!");
    } catch (error) {
      console.error("Error saving resume:", error);
      alert(error instanceof Error ? error.message : "Error saving resume. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { fields: workExperienceFields, append: appendWorkExperience, remove: removeWorkExperience } = useFieldArray({
    control,
    name: 'workExperience'
  });

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
    control,
    name: 'projects'
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: 'education'
  });

  const { fields: skillsFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: 'skills'
  });

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: 'languages'
  });

  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({
    control,
    name: 'certifications'
  });

  const renderStep = () => {
    const commonProps = {
      register,
      errors,
      control,
      watch,
      setValue
    };

    switch(step) {
      case 0:
        return <PersonalInfoStep {...commonProps} />;
      case 1:
        return <CareerObjectiveStep {...commonProps} />;
      case 2:
        return <WorkExperienceStep {...commonProps} fields={workExperienceFields} append={appendWorkExperience} remove={removeWorkExperience}/>;
      case 3:
        return <EducationStep {...commonProps} fields={educationFields} append={appendEducation} remove={removeEducation}/>;
      case 4:
        return <SkillsStep {...commonProps} fields={skillsFields} append={appendSkill} remove={removeSkill}/>;
      case 5:
        return <ProjectsStep {...commonProps} fields={projectFields} append={appendProject} remove={removeProject}/>;
      case 6:
        return <LanguagesStep {...commonProps} fields={languageFields} append={appendLanguage} remove={removeLanguage}/>;
      case 7:
        return <CertificationsStep {...commonProps} fields={certificationFields} append={appendCertification} remove={removeCertification}/>;
      default:
        return null;
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // Progress calculation
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 w-full bg-gray-200 rounded-full">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600 text-center">
            Step {step + 1} of {steps.length}
          </div>
        </div>

        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-6">{steps[step].title}</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {renderStep()}
            
            <NavigationButtons
              step={step}
              totalSteps={steps.length}
              onPrevious={handlePrevious}
              isSubmitting={isSubmitting}
            />
          </form>
        </Card>
      </div>
    </main>
  );
}