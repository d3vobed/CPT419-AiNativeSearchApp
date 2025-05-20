// scancard.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, useColorScheme, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FUTURE_OCCUPATIONS = [
  'Software Engineer', 'AI Researcher', 'Cybersecurity Analyst',
  'Blockchain Developer', 'Game Designer', 'Product Manager',
  'UX Designer', 'Tech Entrepreneur', 'ML Engineer'
];

const ScanCard = () => {
  const scheme = useColorScheme();
  const [image, setImage] = useState(null);
  const [data, setData] = useState({
    full_name: '',
    matric_number: '',
    student_id: '',
    current_occupation: 'Undergraduate',
    future_occupation: FUTURE_OCCUPATIONS[Math.floor(Math.random() * FUTURE_OCCUPATIONS.length)]
  });

  const uploadToSupabase = async (imageUri, extractedData) => {
    const fileName = imageUri.split('/').pop();
    const fileType = fileName.split('.').pop();
    const fileData = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student-idcards')
      .upload(`images/${uuidv4()}.${fileType}`, fileData, {
        contentType: `image/${fileType}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const publicUrl = supabase.storage.from('student-idcards').getPublicUrl(uploadData.path).data.publicUrl;

    const newStudent = {
      id: uuidv4(),
      ...extractedData,
      image_url: publicUrl
    };

    const { error: dbError } = await supabase.from('cpt419_students').insert([newStudent]);
    if (dbError) throw dbError;

    await AsyncStorage.setItem(`student_${newStudent.student_id}`, JSON.stringify(newStudent));
  };

  const handleImagePick = async (source) => {
    try {
      let result;
      if (source === 'camera') {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync({ quality: 1 });
      } else {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
      }

      if (!result.canceled && result.assets.length > 0) {
        const pickedImage = result.assets[0];
        setImage(pickedImage.uri);

        const ocrResult = await Tesseract.recognize(pickedImage.uri, 'eng');
        const text = ocrResult.data.text;

        const matricMatch = text.match(/\b20\d{2}\/\d\/\d{5,6}(CS|CT)\b/);
        const idMatch = text.match(/\bm\d{7}\b/i);
        const nameMatch = text.match(/[A-Z][a-z]+\s[A-Z][a-z]+/); // basic name pattern

        setData({
          ...data,
          full_name: nameMatch ? nameMatch[0] : '',
          matric_number: matricMatch ? matricMatch[0] : '',
          student_id: idMatch ? idMatch[0] : ''
        });
      }
    } catch (error) {
      console.error('OCR or image pick failed:', error);
      Alert.alert('Error', 'Something went wrong while scanning or processing.');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!image || !data.full_name || !data.matric_number || !data.student_id) {
        Alert.alert('Missing Fields', 'Please complete or correct all required fields.');
        return;
      }
      await uploadToSupabase(image, data);
      Alert.alert('Success', 'Student data uploaded successfully.');
    } catch (err) {
      console.error(err);
      Alert.alert('Upload Error', 'Failed to upload student data.');
    }
  };

  return (
    <View style={[styles.container, scheme === 'dark' && styles.darkContainer]}>
      <Text style={[styles.title, scheme === 'dark' && styles.darkText]}>Scan Student ID</Text>

      {image && <Image source={{ uri: image }} style={styles.image} />}

      <Button title="Take Photo" onPress={() => handleImagePick('camera')} />
      <Button title="Upload from Gallery" onPress={() => handleImagePick('gallery')} />

      <TextInput
        style={[styles.input, scheme === 'dark' && styles.darkInput]}
        placeholder="Full Name"
        value={data.full_name}
        onChangeText={(text) => setData({ ...data, full_name: text })}
      />
      <TextInput
        style={[styles.input, scheme === 'dark' && styles.darkInput]}
        placeholder="Matric Number"
        value={data.matric_number}
        onChangeText={(text) => setData({ ...data, matric_number: text })}
      />
      <TextInput
        style={[styles.input, scheme === 'dark' && styles.darkInput]}
        placeholder="Student ID"
        value={data.student_id}
        onChangeText={(text) => setData({ ...data, student_id: text })}
      />

      <Button title="Submit to Supabase" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff'
  },
  darkContainer: {
    backgroundColor: '#121212'
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center'
  },
  darkText: {
    color: '#fff'
  },
  image: {
    width: '100%',
    height: 200,
    marginVertical: 12,
    borderRadius: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },
  darkInput: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    borderColor: '#444'
  }
});

export default ScanCard;

