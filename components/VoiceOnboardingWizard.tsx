// components/VoiceOnboardingWizard.tsx
// Full voice-driven onboarding using expo-speech (TTS) + expo-av (recording)
// + Google Cloud STT via your backend /speech/transcribe endpoint

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import Constants from "expo-constants";
import { useAuth } from "@/context/auth";

import {
  ONBOARDING_QUESTIONS,
  matchTranscriptToOption,
  OnboardingOption,
  OnboardingQuestion,
} from "../utils/kannadaKeywordMapper";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type VoiceState =
  | "idle"         // Waiting to start
  | "speaking"     // TTS is reading the question
  | "listening"    // Mic is recording
  | "processing"   // Sending to backend / waiting for STT result
  | "confirmed"    // Matched an option, showing confirmation
  | "error";       // Something went wrong

interface Props {
  onComplete: (answers: Record<string, string>) => void;
  onFallbackToManual: () => void;
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const API_BASE =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? "http://10.0.2.2:5000/api" : "http://localhost:5000/api");

const MAX_RECORDING_DURATION_MS = 7000; // 7 seconds max per answer
const SILENCE_TIMEOUT_MS = 2500;        // Auto-stop after 2.5s of assumed silence
const CONFIRMATION_DISPLAY_MS = 1500;   // Show confirmed answer for 1.5s before next Q

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
const VoiceOnboardingWizard: React.FC<Props> = ({
  onComplete,
  onFallbackToManual,
}) => {
  const { token } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmedOption, setConfirmedOption] = useState<OnboardingOption | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [language, setLanguage] = useState<"kn" | "en">("kn");

  const recordingRef = useRef<Audio.Recording | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion: OnboardingQuestion = ONBOARDING_QUESTIONS[currentIndex];
  const totalSteps = ONBOARDING_QUESTIONS.length;

  // ── Animate progress bar when question changes ──
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentIndex / (totalSteps - 1)) * 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  // ── Pulse animation while listening ──
  useEffect(() => {
    if (voiceState === "listening") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [voiceState]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      Speech.stop();
      stopRecording();
      clearTimers();
    };
  }, []);

  // ── Auto-start flow when component mounts ──
  useEffect(() => {
    const timer = setTimeout(() => startQuestionFlow(), 800);
    return () => clearTimeout(timer);
  }, []);

  // ── Restart flow when question changes ──
  useEffect(() => {
    if (currentIndex > 0) {
      startQuestionFlow();
    }
  }, [currentIndex]);

  // ─────────────────────────────────────────────
  // AUDIO PERMISSIONS
  // ─────────────────────────────────────────────
  const requestMicPermission = async (): Promise<boolean> => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Microphone Permission Required",
        "Please allow microphone access to use voice onboarding. You can switch to manual entry instead.",
        [
          { text: "Manual Entry", onPress: onFallbackToManual },
          { text: "Try Again", onPress: () => requestMicPermission() },
        ]
      );
      return false;
    }
    return true;
  };

  // ─────────────────────────────────────────────
  // MAIN FLOW: SPEAK → RECORD → TRANSCRIBE → MATCH
  // ─────────────────────────────────────────────

  /**
   * Step 1: Speak the question using TTS
   */
  const startQuestionFlow = useCallback(async () => {
    setVoiceState("speaking");
    setConfirmedOption(null);
    setTranscript("");

    const questionText =
      language === "kn"
        ? currentQuestion.speakTextKn
        : currentQuestion.questionEn;

    try {
      await new Promise<void>((resolve, reject) => {
        Speech.speak(questionText, {
          language: language === "kn" ? "kn-IN" : "en-IN",
          rate: language === "kn" ? 0.85 : 0.9,
          pitch: 1.0,
          onDone: resolve,
          onError: reject,
          onStopped: resolve,
        });
      });
      // TTS finished → start recording
      await startRecording();
    } catch (err) {
      console.warn("TTS error, skipping to recording:", err);
      await startRecording();
    }
  }, [currentIndex, language, currentQuestion]);

  /**
   * Step 2: Start audio recording
   */
  const startRecording = async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      await recording.startAsync();
      recordingRef.current = recording;
      setVoiceState("listening");

      // Auto-stop after max duration
      maxDurationTimerRef.current = setTimeout(() => {
        stopAndTranscribe();
      }, MAX_RECORDING_DURATION_MS);

      // Auto-stop after silence (simulated — real silence detection needs audio level monitoring)
      silenceTimerRef.current = setTimeout(() => {
        if (voiceState === "listening") {
          stopAndTranscribe();
        }
      }, SILENCE_TIMEOUT_MS);
    } catch (err) {
      console.error("Recording error:", err);
      setVoiceState("error");
    }
  };

  /**
   * Step 3: Stop recording and send to backend
   */
  const stopAndTranscribe = useCallback(async () => {
    clearTimers();
    if (!recordingRef.current) return;

    setVoiceState("processing");

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No audio URI");

      await transcribeAudio(uri);
    } catch (err) {
      console.error("Stop/transcribe error:", err);
      handleTranscriptionError();
    }
  }, [currentIndex]);

  /**
   * Step 4: Send audio to backend → get Kannada text back
   */
  const transcribeAudio = async (audioUri: string) => {
    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        type: "audio/m4a",
        name: "voice_answer.m4a",
      } as unknown as Blob);
      formData.append("languageCode", language === "kn" ? "kn-IN" : "en-IN");

      const response = await fetch(`${API_BASE}/speech/transcribe`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const transcribedText: string = data.transcript || "";

      setTranscript(transcribedText);
      matchAndConfirm(transcribedText);
    } catch (err) {
      console.error("Transcription API error:", err);
      Alert.alert("Network Error", "Failed to reach the transcription service. You can try again or tap your answer instead.");
      handleTranscriptionError();
    }
  };

  /**
   * Step 5: Match transcript to an option, confirm, then advance
   */
  const matchAndConfirm = (transcribedText: string) => {
    const matched = matchTranscriptToOption(transcribedText, currentQuestion);

    if (matched) {
      setConfirmedOption(matched);
      setVoiceState("confirmed");

      // Speak the confirmation back to the user
      const confirmText =
        language === "kn"
          ? `ನೀವು ಆರಿಸಿದ್ದು: ${matched.labelKn}. ಇದು ಸರಿಯಾಗಿದೆಯೇ?`
          : `You selected: ${matched.labelEn}. Is this correct?`;

      Speech.speak(confirmText, {
        language: language === "kn" ? "kn-IN" : "en-IN",
        rate: 0.9,
      });
    } else {
      // No match found — retry or ask to try again
      handleNoMatch(transcribedText);
    }
  };

  // ─────────────────────────────────────────────
  // NAVIGATION & ANSWER MANAGEMENT
  // ─────────────────────────────────────────────

  const handleOptionSelected = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    setRetryCount(0);

    if (currentIndex < totalSteps - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // All questions answered
      onComplete(newAnswers);
    }
  };

  const handleNoMatch = (transcribedText: string) => {
    if (retryCount < 1) {
      setRetryCount((c) => c + 1);
      const retryText =
        language === "kn"
          ? `ಕ್ಷಮಿಸಿ, ನಾನು ಅರ್ಥ ಮಾಡಿಕೊಳ್ಳಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಹೇಳಿ.`
          : "Sorry, I didn't catch that. Please try again.";

      Speech.speak(retryText, {
        language: language === "kn" ? "kn-IN" : "en-IN",
        onDone: () => startRecording(),
      });
      setVoiceState("idle");
    } else {
      // After 1 retry, show manual option selection explicitly
      setVoiceState("error");
      Speech.speak(
        language === "kn"
          ? "ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಆಯ್ಕೆಯನ್ನು ಸ್ಪರ್ಶಿಸಿ."
          : "Please tap an option below.",
        { language: language === "kn" ? "kn-IN" : "en-IN" }
      );
    }
  };

  const handleTranscriptionError = () => {
    setRetryCount((c) => c + 1);
    if (retryCount >= 1) {
      setVoiceState("error");
    } else {
      setVoiceState("idle");
    }
  };

  const clearTimers = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (_) {}
      recordingRef.current = null;
    }
  };

  // ─────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────

  const getStatusLabel = (): string => {
    switch (voiceState) {
      case "speaking":
        return language === "kn" ? "ಓದುತ್ತಿದ್ದೇನೆ..." : "Reading question...";
      case "listening":
        return language === "kn" ? "ಕೇಳುತ್ತಿದ್ದೇನೆ..." : "Listening...";
      case "processing":
        return language === "kn" ? "ಅರ್ಥ ಮಾಡಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ..." : "Processing...";
      case "confirmed":
        return language === "kn" ? "✓ ಆಯ್ಕೆ ದಾಖಲಾಯಿತು" : "✓ Answer recorded";
      case "error":
        return language === "kn" ? "ಕೆಳಗೆ ಒಂದನ್ನು ಸ್ಪರ್ಶಿಸಿ" : "Tap an option below";
      default:
        return language === "kn" ? "ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ" : "Tap mic to speak";
    }
  };

  const getMicIcon = (): string => {
    if (voiceState === "listening") return "🎙️";
    if (voiceState === "processing") return "⏳";
    if (voiceState === "confirmed") return "✅";
    return "🎤";
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Header with Step Counter & Language Toggle ── */}
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          {language === "kn"
            ? `ಹಂತ ${currentIndex + 1} / ${totalSteps}`
            : `Step ${currentIndex + 1} of ${totalSteps}`}
        </Text>
        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => setLanguage((l) => (l === "kn" ? "en" : "kn"))}
        >
          <Text style={styles.langToggleText}>
            {language === "kn" ? "EN" : "ಕನ್ನಡ"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressDots}>
        {ONBOARDING_QUESTIONS.map((_, i) => (i <= currentIndex ? "●" : "○")).join("  ")}
      </Text>

      {/* ── Question ── */}
      <TouchableOpacity 
        style={styles.questionCard} 
        activeOpacity={0.7}
        onPress={() => {
          Speech.stop();
          Speech.speak(
            language === "kn" ? currentQuestion.speakTextKn : currentQuestion.questionEn,
            {
              language: language === "kn" ? "kn-IN" : "en-IN",
              rate: language === "kn" ? 0.85 : 0.9,
            }
          );
        }}
      >
        <Text style={styles.questionKn}>{currentQuestion.questionKn}</Text>
        <Text style={styles.questionEn}>{currentQuestion.questionEn}</Text>
      </TouchableOpacity>

      {/* ── Transcript Display (what we heard) ── */}
      {transcript.length > 0 && voiceState !== "confirmed" && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>
            {language === "kn" ? "ನೀವು ಹೇಳಿದ್ದು:" : "We heard:"}
          </Text>
          <Text style={styles.transcriptText}>"{transcript}"</Text>
        </View>
      )}

      {/* ── Confirmed Option Banner ── */}
      {voiceState === "confirmed" && confirmedOption && (
        <View style={styles.confirmedBanner}>
          <Text style={styles.confirmedText}>
            ✓ {confirmedOption.labelKn} / {confirmedOption.labelEn}
          </Text>
          <View style={styles.confirmActionRow}>
            <TouchableOpacity style={styles.confirmActionBtn} onPress={() => handleOptionSelected(confirmedOption.value)}>
              <Text style={styles.confirmActionText}>{language === "kn" ? "ಖಚಿತಪಡಿಸಿ" : "Confirm"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmActionBtnSecondary} onPress={startQuestionFlow}>
              <Text style={styles.confirmActionTextSecondary}>{language === "kn" ? "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ" : "Try again"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmActionBtnSecondary} onPress={() => setVoiceState("idle")}>
              <Text style={styles.confirmActionTextSecondary}>{language === "kn" ? "ಟೈಪ್ ಮಾಡಿ" : "Type manually"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Mic Button (primary interaction) ── */}
      {voiceState !== "error" && voiceState !== "confirmed" && (
        <View style={styles.micContainer}>
          <TouchableOpacity
            onPress={() => {
              if (voiceState === "listening") {
                stopAndTranscribe();
              } else if (voiceState === "idle" || voiceState === "speaking") {
                startQuestionFlow();
              }
            }}
            disabled={voiceState === "processing"}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.micButton,
                voiceState === "listening" && styles.micButtonActive,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {voiceState === "processing" ? (
                <ActivityIndicator size="large" color="#FF8C00" />
              ) : (
                <Text style={styles.micIcon}>{getMicIcon()}</Text>
              )}
            </Animated.View>
          </TouchableOpacity>

          <Text style={styles.statusLabel}>{getStatusLabel()}</Text>

          {voiceState === "listening" && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopAndTranscribe}
            >
              <Text style={styles.stopButtonText}>
                {language === "kn" ? "ನಿಲ್ಲಿಸಿ" : "Stop"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Manual Option Fallback (shown on error or after retries) ── */}
      {voiceState !== "confirmed" && (
        <View style={styles.optionsContainer}>
          <Text style={styles.orLabel}>
            {language === "kn" ? "— ಅಥವಾ ಸ್ಪರ್ಶಿಸಿ —" : "— or tap your answer —"}
          </Text>
          {currentQuestion.options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionCard,
                confirmedOption?.value === opt.value && styles.optionCardSelected,
              ]}
              onPress={() => handleOptionSelected(opt.value)}
            >
              <Text style={styles.optionKn}>{opt.labelKn}</Text>
              <Text style={styles.optionEn}>{opt.labelEn}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Bottom Actions ── */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.replayButton}
          onPress={() => {
            Speech.stop();
            startQuestionFlow();
          }}
        >
          <Text style={styles.replayText}>
            {language === "kn" ? "🔁 ಮತ್ತೆ ಕೇಳಿ" : "🔁 Replay"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={onFallbackToManual}
        >
          <Text style={styles.manualText}>
            {language === "kn" ? "✏️ ಟೈಪ್ ಮಾಡಿ" : "✏️ Manual Entry"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1117",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stepLabel: {
    color: "#E8A020",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  langToggle: {
    backgroundColor: "#1E2530",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E8A020",
  },
  langToggleText: {
    color: "#E8A020",
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#1E2530",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E8A020",
    borderRadius: 4,
  },
  progressDots: {
    color: "#E8A020",
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: "#1A1F2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#E8A020",
  },
  questionKn: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: 6,
  },
  questionEn: {
    color: "#9BA3B0",
    fontSize: 15,
    lineHeight: 22,
  },
  transcriptBox: {
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  transcriptLabel: {
    color: "#9BA3B0",
    fontSize: 12,
    marginBottom: 4,
  },
  transcriptText: {
    color: "#E2E8F0",
    fontSize: 16,
    fontStyle: "italic",
  },
  confirmedBanner: {
    backgroundColor: "#14532D",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#16A34A",
  },
  confirmedText: {
    color: "#4ADE80",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  confirmActionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  confirmActionBtn: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmActionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  confirmActionBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4ADE80",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmActionTextSecondary: {
    color: "#4ADE80",
    fontWeight: "600",
    fontSize: 14,
  },
  micContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  micButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1E2530",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#E8A020",
    shadowColor: "#E8A020",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: "#7C2D00",
    borderColor: "#EF4444",
    shadowColor: "#EF4444",
  },
  micIcon: {
    fontSize: 38,
  },
  statusLabel: {
    color: "#CBD5E1",
    fontSize: 15,
    marginTop: 12,
    fontWeight: "500",
  },
  stopButton: {
    marginTop: 10,
    backgroundColor: "#EF4444",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  stopButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  optionsContainer: {
    marginTop: 8,
  },
  orLabel: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: "#1A1F2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  optionCardSelected: {
    borderColor: "#E8A020",
    backgroundColor: "#2A1F0E",
  },
  optionKn: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  optionEn: {
    color: "#9BA3B0",
    fontSize: 14,
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingVertical: 16,
    gap: 12,
  },
  replayButton: {
    flex: 1,
    backgroundColor: "#1E2530",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  replayText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  manualButton: {
    flex: 1,
    backgroundColor: "#1E2530",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  manualText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default VoiceOnboardingWizard;
