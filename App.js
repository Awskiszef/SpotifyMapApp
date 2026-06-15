import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions, TextInput, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, ResponseType, exchangeCodeAsync } from 'expo-auth-session';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function App() {
  const [location, setLocation] = useState(null);

  // Konfiguracja Spotify
  const [clientId, setClientId] = useState('');
  const [isClientSet, setIsClientSet] = useState(false);
  const [token, setToken] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);

  const redirectUri = makeRedirectUri({
    scheme: 'spotifymapapp'
  });

  // 2. Drukujemy go w konsoli, żeby wiedzieć, co wpisać w Spotify
  console.log("SKOPIUJ TEN DOKŁADNY ADRES DO PANELU SPOTIFY:", redirectUri);

  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Code,
      clientId: clientId,
      scopes: ['user-read-currently-playing', 'user-read-playback-state', 'user-modify-playback-state'],
      usePKCE: true,
      redirectUri: redirectUri,
    },
    discovery
  );

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Brak dostępu do lokalizacji');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && request?.codeVerifier) {
      const { code } = response.params;
      exchangeCodeAsync(
        {
          clientId,
          code,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        discovery
      )
        .then((tokenResponse) => {
          setToken(tokenResponse.accessToken);
          fetchNowPlaying(tokenResponse.accessToken);
        })
        .catch((err) => {
          console.log('Błąd podczas wymiany kodu na token', err);
        });
    }
  }, [response, request]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchNowPlaying(token);
    }, 5000); // Odświeżaj co 5 sekund
    return () => clearInterval(interval);
  }, [token]);

  const fetchNowPlaying = async (accessToken) => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (res.status === 200) {
        const data = await res.json();
        setNowPlaying(data);
      } else {
        setNowPlaying(null);
      }
    } catch (e) {
      console.log('Błąd podczas pobierania danych ze Spotify', e);
    }
  };

  const skipToNext = async () => {
    if (!token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => fetchNowPlaying(token), 500);
    } catch (e) { console.log(e); }
  };

  const skipToPrevious = async () => {
    if (!token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => fetchNowPlaying(token), 500);
    } catch (e) { console.log(e); }
  };

  const togglePlayback = async () => {
    if (!token || !nowPlaying) return;
    const isPlaying = nowPlaying.is_playing;
    const url = isPlaying
      ? 'https://api.spotify.com/v1/me/player/pause'
      : 'https://api.spotify.com/v1/me/player/play';
    try {
      await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNowPlaying({ ...nowPlaying, is_playing: !isPlaying });
      setTimeout(() => fetchNowPlaying(token), 500);
    } catch (e) { console.log(e); }
  };

  // 1. Ekran Konfiguracji (podawanie Client ID)
  if (!isClientSet) {
    return (
      <View style={styles.setupContainer}>
        <StatusBar style="light" />
        <Text style={styles.title}>Mapify</Text>
        <Text style={styles.subtitle}>Zanim zaczniemy, podaj swoje Client ID z aplikacji utworzonej w Spotify Developer Dashboard.</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Jako Redirect URI w panelu Spotify dodaj dokładnie ten adres:</Text>
          <Text selectable style={styles.codeBlock}>{redirectUri}</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Wklej tutaj Client ID"
          placeholderTextColor="#888"
          value={clientId}
          onChangeText={setClientId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.btn, !clientId && { opacity: 0.5 }]}
          disabled={!clientId}
          onPress={() => setIsClientSet(true)}
        >
          <Text style={styles.btnText}>Rozpocznij</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Ekran z mapą, ale brak tokena - trzeba się zalogować do Spotify
  if (!token) {
    return (
      <View style={styles.setupContainer}>
        <StatusBar style="light" />
        <Text style={styles.title}>Prawie gotowe!</Text>
        <Text style={styles.subtitle}>Teraz połącz aplikację ze swoim kontem Spotify.</Text>

        <TouchableOpacity
          style={styles.spotifyBtn}
          disabled={!request}
          onPress={() => promptAsync()}
        >
          <Text style={styles.btnText}>Połącz ze Spotify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Widok Główny - Mapa i aktualnie odtwarzany utwór
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={true}
        initialRegion={location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
      />

      <View style={styles.glassOverlay}>
        {nowPlaying && nowPlaying.item ? (
          <View style={styles.nowPlayingContent}>
            <Image
              source={{ uri: nowPlaying.item.album.images[0]?.url }}
              style={styles.albumArt}
            />
            <View style={styles.trackInfo}>
              <Text style={styles.trackName} numberOfLines={1}>
                {nowPlaying.item.name}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {nowPlaying.item.artists.map(a => a.name).join(', ')}
              </Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: nowPlaying.is_playing ? '#1DB954' : '#888' }]} />
                <Text style={styles.statusText}>{nowPlaying.is_playing ? 'Odtwarzane' : 'Wstrzymane'}</Text>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity onPress={skipToPrevious} style={styles.controlBtn}>
                <Ionicons name="play-skip-back" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlayback} style={styles.controlBtnPlay}>
                <Ionicons name={nowPlaying.is_playing ? "pause" : "play"} size={28} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={skipToNext} style={styles.controlBtn}>
                <Ionicons name="play-skip-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.nowPlayingContent}>
            <View style={[styles.albumArt, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 24 }}>🎵</Text>
            </View>
            <View style={styles.trackInfo}>
              <Text style={styles.trackName}>Brak aktywnego odtwarzania</Text>
              <Text style={styles.artistName}>Włącz muzykę w Spotify!</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  setupContainer: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#b3b3b3',
    textAlign: 'center',
    marginBottom: 40,
  },
  infoBox: {
    backgroundColor: '#282828',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  codeBlock: {
    backgroundColor: '#000',
    color: '#1DB954',
    padding: 15,
    borderRadius: 8,
    fontFamily: 'Courier',
    fontSize: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    padding: 18,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  btn: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  spotifyBtn: {
    width: '100%',
    backgroundColor: '#1DB954',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  glassOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artistName: {
    color: '#b3b3b3',
    fontSize: 14,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  controlBtn: {
    padding: 8,
  },
  controlBtnPlay: {
    backgroundColor: '#1DB954',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  }
});
