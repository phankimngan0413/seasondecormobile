import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Button, Image, ScrollView } from "react-native";
import { getAccountDetails, updateAccountDetails, updateAvatar } from "@/utils/accountAPI"; // Import your API functions
import BirthdayDatePicker from "@/components/ui/DatePicker"; // Import BirthdayDatePicker
import InputField from "@/components/InputField"; // Import the custom InputField
import { launchImageLibrary, ImageLibraryOptions } from "react-native-image-picker"; // Import image picker
import CustomButton from "@/components/ui/Button/Button";

const AccountScreen = () => {
  const [userData, setUserData] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [dob, setDob] = useState(new Date()); // Initialize dob with the current date or from user data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null); // Store the avatar URL
  const [gender, setGender] = useState<string>("Male"); // Store the selected gender

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAccountDetails(); // Fetch account details
        setUserData(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPhone(data.phone);
        setSlug(data.slug);
        
        const fetchedDob = new Date(data.dateOfBirth); // Format the date accordingly
        console.log(fetchedDob); // Check if the date is correct
        setDob(fetchedDob); // Update the dob state
  
        setAvatar(data.avatar); // Set the avatar URL from the API response
        setGender(data.gender); // Set the gender from the API response
      } catch (err) {
        setError("Failed to fetch account data.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const updatedData = {
      firstName,
      lastName,
      phone,
      slug,
      dateOfBirth: dob.toISOString().split("T")[0], // Format the date to a string
      gender, // Include gender in the update
    };

    try {
      await updateAccountDetails(updatedData); // Update account data
      setUserData(updatedData);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      setError("Failed to update account data.");
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar change
  const handleAvatarChange = async () => {
    const options: ImageLibraryOptions = {
      mediaType: "photo",
      quality: 1,
      includeBase64: false,
    };
  
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.log("ImagePicker Error: ", response.errorMessage);
      } else {
        // Ensure assets is defined before accessing it
        if (response.assets && response.assets.length > 0) {
          const newAvatarUri = response.assets[0].uri; // Get the URI of the selected image
  
          if (newAvatarUri) {
            setAvatar(newAvatarUri); // Update avatar state locally
  
            // Prepare the image for upload (in case you need to upload it to the API)
            const formData = new FormData();
            const imageFile = {
              uri: newAvatarUri,
              type: "image/png", // Use correct MIME type (adjust depending on your image type)
              name: "avatar.png", // Adjust the name of the image file
            } as any;

            formData.append("file", imageFile);
  
            // Send the image to the server via your API
            updateAvatar(formData)
              .then(() => {
                Alert.alert("Success", "Avatar updated successfully!");
              })
              .catch((error) => {
                console.error("Avatar update failed:", error);
                Alert.alert("Error", "Failed to update avatar.");
              });
          }
        } else {
          console.log("No assets found in the response");
        }
      }
    });
  };
  

  if (loading) {
    return <ActivityIndicator size="large" color="#3498db" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Account Information</Text>

      {/* Display Avatar */}
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <Text>No Avatar</Text>
        )}
        <Button title="Change Avatar" onPress={handleAvatarChange} />
      </View>

      <Text style={styles.label}>Email:</Text>
      <Text>{userData?.email}</Text>

      <Text style={styles.label}>Slug:</Text>
      <InputField
        icon="pencil" // Example icon
        value={slug}
        onChangeText={setSlug}
        placeholder="Enter slug" label={""}      />

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>First Name:</Text>
          <InputField
            icon="person"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name" label={""}          />
        </View>
        <View style={styles.column}>
          <Text style={styles.label}>Last Name:</Text>
          <InputField
            icon="person"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name" label={""}          />
        </View>
      </View>

      <Text style={styles.label}>Phone Number:</Text>
      <InputField
        icon="call"
        value={phone}
        onChangeText={setPhone}
        placeholder="Enter phone number" label={""}      />

      <Text style={styles.label}>Gender:</Text>
      <InputField
        icon="person" // Gender icon
        value={gender}
        onChangeText={setGender}
        placeholder="Enter gender" label={""}      />

      {/* Integrating BirthdayDatePicker */}
      <BirthdayDatePicker
  label="Date of Birth"
  selectedDate={dob instanceof Date && !isNaN(dob.getTime()) ? dob : new Date()} // Set default if invalid
  onChange={setDob}
/>


      <CustomButton title="Update Profile" onPress={handleUpdate} disabled={loading} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    marginRight: 10,
  },
  avatarContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default AccountScreen;