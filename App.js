import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Button, ScrollView } from 'react-native';
import ScanCard from './ScanCard';
import { supabase } from './supabase';

export default function App() {
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const { data, error } = await supabase
      .from('cpt419_students')
      .select('*')
      .or(`matric_number.ilike.%${searchQuery}%,student_id.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);

    if (error) {
      console.error("Search error:", error.message);
      return;
    }

    setResults(data);
  };

  const renderStudent = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.full_name}</Text>
      <Text>Matric: {item.matric_number}</Text>
      <Text>Student ID: {item.student_id}</Text>
      <Text>Department: {item.department}</Text>
      <Text>Future Occupation: {item.future_occupation}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎓 FUTMINNA ID Card OCR App</Text>

      <Button title={showScanner ? "Back to Search" : "Scan New ID"} onPress={() => setShowScanner(!showScanner)} />

      {showScanner ? (
        <ScanCard onUploadComplete={() => setShowScanner(false)} />
      ) : (
        <>
          <TextInput
            placeholder="Search by Matric No, Name or ID"
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Button title="Search" onPress={handleSearch} />

          {results.length > 0 && (
            <>
              <Text style={styles.resultCount}>{results.length} result(s) found</Text>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={renderStudent}
              />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultCount: {
    marginTop: 10,
    marginBottom: 5,
    fontStyle: 'italic',
  }
});
