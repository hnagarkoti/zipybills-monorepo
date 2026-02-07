import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World! 👋</Text>
      <Text style={styles.subtitle}>Welcome to Zipybills Barcode Scanner</Text>
      <Text style={styles.description}>
        Your app is running successfully on Web and Mobile!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: { 
    fontSize: 48, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#007AFF'
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24
  }
});
