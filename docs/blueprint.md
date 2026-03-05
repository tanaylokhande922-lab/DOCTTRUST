# **App Name**: DocTrust

## Core Features:

- Secure User Authentication: Enable practitioners and patients to securely register and log in using Firebase Authentication.
- Practitioner Profile Management: Allow registered practitioners to create and update their profiles, including name, specialization, unique identifier, and location, stored in Firestore.
- Verification Certificate Upload: Provide a facility for practitioners to upload their 'Certificate PDF/Image' as part of the verification process.
- Automated Verification Tool: Implement a tool within the Doctor Portal to check submitted Medical Registration Numbers against a mock official list, automatically updating the `Verified_Status` field in Firestore for valid IDs.
- Interactive Doctor Map: Display all registered practitioners on a Leaflet.js map in the Patient Portal, showing a blue shield icon for verified doctors and a grey dot for unverified ones.
- Specialization Search & Filter: Integrate a search bar in the Patient Portal to allow users to filter practitioners by their specialization.
- Dynamic Landing Page: Present a clean, split-screen landing page featuring 'Search Verified Doctors' and 'Register as a Practitioner' buttons.

## Style Guidelines:

- A light color scheme centered on 'Medical Blue'. The primary color for interactive elements is a strong, trusting blue (#0052CC). The background color is a very light, almost white blue (#F3F6F7) to maintain cleanliness and professionalism. An accent color of vibrant cyan (#54D4E6) is used for highlights and specific calls to action to ensure contrast and modern flair.
- A single font, 'Inter' (sans-serif), will be used for both headlines and body text, providing a modern, objective, and highly legible aesthetic suitable for a healthcare application.
- A blue shield icon will clearly designate verified practitioners on the map, while a subtle grey dot will indicate unverified practitioners. All other icons will adhere to a clean, minimalistic 'Healthcare 2.0' visual style.
- The application will feature a distinct split-screen hero section on the landing page and be fully mobile-responsive across all interfaces to ensure optimal user experience on various devices.
- A celebratory confetti animation will be triggered upon successful verification in the Doctor Portal, providing immediate and positive feedback to the user.