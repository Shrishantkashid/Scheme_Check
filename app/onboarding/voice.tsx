import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import axios from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';
import { QuestionEngine } from '@/components/onboarding/QuestionEngine';
import { ONBOARDING_QUESTIONS, INITIAL_QUESTION_ID } from '@/constants/questions';
import { useAuth } from '@/context/auth';
import { API_URL } from '@/constants/config';

export default function VoiceOnboarding() {
  const { user, token } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [currentId, setCurrentId] = useState(user?.lastQuestionId || INITIAL_QUESTION_ID);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [heardText, setHeardText] = useState('');
  const [voiceTrigger, setVoiceTrigger] = useState<{ value: string; timestamp: number } | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const currentQuestion = ONBOARDING_QUESTIONS[currentId];

  useEffect(() => {
    if (!currentId) return;
    
    Speech.stop();
    const timer = setTimeout(() => {
      speakQuestion();
    }, 600);
    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, [currentId]);

  const speakQuestion = async () => {
    if (!currentQuestion) return;
    if (isSpeaking) await Speech.stop();
    setIsSpeaking(true);
    setHeardText('');
    
    const optionsText = currentQuestion.options 
      ? `. ನಿಮ್ಮ ಆಯ್ಕೆಗಳು: ${currentQuestion.options.map(o => o.label).join(', ')}`
      : '';
    
    await Speech.speak(currentQuestion.kannadaText + optionsText, {
      language: 'kn-IN',
      onDone: () => {
        setIsSpeaking(false);
        startListening();
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const startListening = async () => {
    setHeardText('');
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.m4a',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      recordingRef.current = recording;
      setIsListening(true);
      
      // Auto-stop after 5 seconds of silence/speaking
      setTimeout(() => {
        if (recordingRef.current && isListening) {
           handleFinishRecording();
        }
      }, 5000);

    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const handleFinishRecording = async () => {
    if (!recordingRef.current || !isListening) return;

    setIsListening(false);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (uri) {
        processVoice(uri);
      }
    } catch (err) {
      console.error('Stop recording failed', err);
    }
  };

  const processVoice = async (uri: string) => {
    setHeardText('ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...'); 
    
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('audio', {
        uri,
        name: 'speech.m4a',
        type: 'audio/m4a',
      });

      const response = await axios.post(`${API_URL}/speech/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      const transcription = response.data.transcription;
      if (transcription) {
        setHeardText(`" ${transcription} "`);
        matchResultToChoice(transcription);
      } else {
        setHeardText('ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ'); 
        setTimeout(() => setHeardText(''), 2000);
      }
    } catch (err) {
      console.error('Transcription error', err);
      // If the user hasn't added the API key yet, the backend will return an error
      setHeardText('API Key Needed');
    }
  };

  const matchResultToChoice = (text: string) => {
    const lowerText = text.toLowerCase();
    let matchedValue = '';

    if (currentQuestion.type === 'choice' && currentQuestion.options) {
      const directMatch = currentQuestion.options.find(o => 
        lowerText.includes(o.label.toLowerCase()) || 
        o.label.toLowerCase().includes(lowerText)
      );

      if (directMatch) {
         matchedValue = directMatch.value;
      } else {
        // Kannada Keyword Mapping
        if (currentId === 'gender') {
          if (lowerText.includes('ಗಂಡು') || lowerText.includes('ಪುರುಷ')) matchedValue = 'male';
          if (lowerText.includes('ಹೆಣ್ಣು') || lowerText.includes('ಮಹಿಳೆ')) matchedValue = 'female';
        } else if (currentId === 'location') {
          if (lowerText.includes('ಹಳ್ಳಿ') || lowerText.includes('ಗ್ರಾಮ')) matchedValue = 'rural';
          if (lowerText.includes('ನಗರ') || lowerText.includes('ಪೇಟೆ')) matchedValue = 'urban';
        } else if (currentQuestion.id === 'disability' || currentQuestion.id === 'bpl_card') {
          if (lowerText.includes('ಹೌದು') || lowerText.includes('ಇದೆ')) matchedValue = 'yes';
          if (lowerText.includes('ಇಲ್ಲ') || lowerText.includes('ಅಲ್ಲ')) matchedValue = 'no';
        }
      }
    } else if (currentQuestion.type === 'number') {
      const num = lowerText.match(/\d+/);
      if (num) matchedValue = num[0];
    }

    if (matchedValue) {
      setTimeout(() => {
        setVoiceTrigger({
          value: matchedValue,
          timestamp: Date.now()
        });
      }, 1000);
    }
  };

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withRepeat(withSequence(withTiming(1.3, { duration: 500 }), withTiming(1, { duration: 500 })), -1) }],
      opacity: isListening ? 1 : 0.5,
    };
  });

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <ThemedText style={styles.stepIndicator}>VOICE ASSISTANT ACTIVE</ThemedText>

          <View style={styles.mainDisplay}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => isListening ? handleFinishRecording() : startListening()}
            >
              <Animated.View style={[styles.micPulse, isListening && pulseStyle]}>
                <View style={styles.micCircle}>
                  <Ionicons 
                    name={isListening ? "mic" : isSpeaking ? "volume-high" : "mic-outline"} 
                    size={48} 
                    color="#FFFFFF" 
                  />
                </View>
              </Animated.View>
            </TouchableOpacity>
            
            <ThemedText style={styles.statusText}>
              {isSpeaking ? "ನಾನು ಹೇಳುತ್ತಿದ್ದೇನೆ..." : isListening ? "ನೀವು ಹೇಳಿ... (Tap to Stop)" : "ದನಿಗಾಗಿ ಕಾಯುತ್ತಿದ್ದೇನೆ..."}
            </ThemedText>
            
            {heardText ? (
              <Animated.View entering={FadeIn}>
                 <ThemedText style={styles.heardLabel}>ಗುರುತಿಸಲಾಗಿದೆ:</ThemedText>
                 <ThemedText style={styles.heardValue}>{heardText}</ThemedText>
              </Animated.View>
            ) : (
              <View style={styles.questionDisplay}>
                <TouchableOpacity activeOpacity={0.7} onPress={speakQuestion}>
                  <ThemedText style={styles.kannadaDisplay}>
                    {currentQuestion?.kannadaText || ''}
                  </ThemedText>
                  <View style={styles.replayRow}>
                    <Ionicons name="refresh" size={12} color={Colors.premium.primary} />
                    <ThemedText style={styles.replayText}>ಮುತ್ತೆ ಕೇಳಲು ಇಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ</ThemedText>
                  </View>
                </TouchableOpacity>

                {isListening && currentQuestion && currentQuestion.options && (
                  <View style={styles.simulationGrid}>
                    <ThemedText style={styles.simulationHint}>OR SELECT MANUALLY:</ThemedText>
                    <View style={styles.simulationButtons}>
                      {currentQuestion.options.map((opt) => (
                        <TouchableOpacity 
                          key={opt.value} 
                          style={styles.simButton} 
                          onPress={() => setVoiceTrigger({ value: opt.value, timestamp: Date.now() })}
                        >
                          <ThemedText style={styles.simButtonText}>{opt.label}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.engineWrapper}>
             <QuestionEngine 
               mode="voice" 
               voiceTrigger={voiceTrigger}
               onQuestionChange={(id) => setCurrentId(id)}
               onComplete={() => router.replace('/(tabs)')} 
             />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.premium.primary,
    letterSpacing: 2,
    marginBottom: 40,
    textAlign: 'center',
  },
  mainDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.6,
  },
  micPulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  micCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.premium.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.premium.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 32,
  },
  kannadaDisplay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 34,
  },
  replayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  replayText: {
    fontSize: 12,
    color: Colors.premium.primary,
    fontWeight: '600',
  },
  heardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.premium.primary,
    textAlign: 'center',
  },
  engineWrapper: {
    flex: 0.4,
    opacity: 0, 
  },
  questionDisplay: {
    alignItems: 'center',
    width: '100%',
  },
  simulationGrid: {
    marginTop: 40,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  simulationHint: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    marginBottom: 16,
  },
  simulationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  simButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  simButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.premium.primary,
  },
});
