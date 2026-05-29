import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TextInput, Pressable, Alert} from 'react-native';
import {DEFAULT_BASE_URL, getBaseUrl, loadBaseUrl, setBaseUrl} from '../api/client';

export default function SettingsScreen() {
  const [url, setUrl] = useState(getBaseUrl());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadBaseUrl().then(setUrl);
  }, []);

  const onSave = async () => {
    if (!/^https?:\/\//i.test(url.trim())) {
      Alert.alert('Invalid URL', 'Enter a full URL, e.g. http://192.168.1.22:9921');
      return;
    }
    await setBaseUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Backend URL</Text>
      <Text style={styles.help}>
        Where the Sailing Weather Checker API is reachable from this device (same LAN). The API
        listens on port 9921.
      </Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder={DEFAULT_BASE_URL}
        placeholderTextColor="#6b7280"
      />
      <Pressable style={styles.btn} onPress={onSave}>
        <Text style={styles.btnText}>{saved ? 'Saved!' : 'Save'}</Text>
      </Pressable>

      <Text style={styles.note}>
        Full sailing thresholds and the email / WhatsApp / Teams notification settings are managed
        in the web app for now — they'll arrive in a later release of the mobile app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#030712', padding: 16},
  label: {color: '#e5e7eb', fontSize: 16, fontWeight: '700'},
  help: {color: '#6b7280', fontSize: 13, marginTop: 4, marginBottom: 12},
  input: {
    backgroundColor: '#111827',
    color: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  btn: {
    marginTop: 16,
    backgroundColor: '#0369a1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {color: '#fff', fontWeight: '700'},
  note: {color: '#6b7280', fontSize: 12, marginTop: 24, lineHeight: 18},
});
