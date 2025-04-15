import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import Autocomplete from 'react-native-autocomplete-input';
import { supabase } from './supabase';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase.from('cpt419_students').select('*');
      if (!error) setStudents(data);
      else console.error(error);
    };
    fetchStudents();
  }, []);

  const onSearch = (text) => {
    setSearchQuery(text);
    setSelected(null);
    const matches = students.filter((s) =>
      s.full_name.toLowerCase().includes(text.toLowerCase())
    );
    setFiltered(matches);
  };

  const handleSelect = (item) => {
    setSearchQuery(item.full_name);
    setFiltered([]);
    setSelected(item);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Student CPT Search</Text>
      <Autocomplete
        autoCapitalize="none"
        autoCorrect={false}
        data={searchQuery === '' ? [] : filtered}
        defaultValue={searchQuery}
        onChangeText={onSearch}
        placeholder="Search student by name"
        inputContainerStyle={styles.inputContainer}
        containerStyle={styles.autoCompleteContainer}
        listStyle={styles.listStyle}
        flatListProps={{
          keyExtractor: (_, i) => i.toString(),
          renderItem: ({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)}>
              <Text style={styles.autoItem}>{item.full_name}</Text>
            </TouchableOpacity>
          )
        }}
      />

      {selected && (
        <View style={styles.card}>
          <Text style={styles.name}>{selected.full_name}</Text>
          <Text style={styles.occupation}>Current: {selected.current_occupation}</Text>
          <Text style={styles.future}>Future: {selected.future_occupation}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  autoCompleteContainer: {
    zIndex: 1,
    marginBottom: 20,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  listStyle: {
    maxHeight: 150,
  },
  autoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#f0f8ff',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  name: {
    fontSize: width > 400 ? 20 : 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  occupation: {
    fontSize: 16,
    color: '#333',
  },
  future: {
    fontSize: 16,
    color: '#777',
    marginTop: 4,
  },
});
