import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { X, Clock, ChevronDown } from "lucide-react-native";
import { CartoonButton, CartoonCard, CartoonInput } from "@/core_ui/components";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { createTask, updateTask } from "../services";
import { scheduleNotificationsForDaily } from "@/features/notifications/service";
import type { TaskType, Difficulty } from "../types";

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  defaultType: TaskType;
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 1, label: "Easy", color: "bg-green-400" },
  { value: 2, label: "Medium", color: "bg-yellow-sunburst" },
  { value: 3, label: "Hard", color: "bg-red-400" },
];

const UNIT_PRESETS = ["cups", "km", "times", "minutes", "pages", "reps"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


const LABEL_STYLE = { fontFamily: "Nunito_700Bold" };
const HEADING_STYLE = { fontFamily: "Nunito_800ExtraBold" };

export function CreateTaskModal({ visible, onClose, defaultType }: CreateTaskModalProps) {
  const user = useAuthStore((s) => s.user);

  // Core fields
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Daily-specific
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [targetCount, setTargetCount] = useState("");
  const [unit, setUnit] = useState("times");
  const [customUnit, setCustomUnit] = useState("");
  const [hasTimer, setHasTimer] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Habit-specific
  const [weeklyTarget, setWeeklyTarget] = useState("3");
  const [trackSession, setTrackSession] = useState(false);
  const [sessionTarget, setSessionTarget] = useState("");
  const [sessionUnit, setSessionUnit] = useState("minutes");
  const [sessionCustomUnit, setSessionCustomUnit] = useState("");
  const [sessionHasTimer, setSessionHasTimer] = useState(false);

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setDifficulty(2);
    setScheduledDays([0, 1, 2, 3, 4, 5, 6]);
    setTargetCount("");
    setUnit("times");
    setCustomUnit("");
    setHasTimer(false);
    setScheduledTime(null);
    setShowTimePicker(false);
    setWeeklyTarget("3");
    setTrackSession(false);
    setSessionTarget("");
    setSessionUnit("minutes");
    setSessionCustomUnit("");
    setSessionHasTimer(false);
    setError("");
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    if (!title.trim()) { setError("Title is required"); return; }

    const parsedTarget = parseInt(targetCount, 10);
    if (defaultType === "daily" && targetCount && (isNaN(parsedTarget) || parsedTarget < 1)) {
      setError("Target count must be a positive number");
      return;
    }

    const parsedWeekly = parseInt(weeklyTarget, 10);
    if (defaultType === "habit" && (isNaN(parsedWeekly) || parsedWeekly < 1)) {
      setError("Weekly target must be at least 1");
      return;
    }

    setSaving(true);
    setError("");

    // Format Date → "HH:MM" for storage
    const timeString = scheduledTime
      ? `${String(scheduledTime.getHours()).padStart(2, "0")}:${String(scheduledTime.getMinutes()).padStart(2, "0")}`
      : undefined;

    try {
      const finalUnit = unit === "custom" ? customUnit.trim() || "times" : unit;

      const taskId = await createTask(user.uid, {
        type: defaultType,
        title,
        notes,
        difficulty,
        // Daily
        ...(defaultType === "daily" && {
          scheduled_days: scheduledDays,
          target_count: targetCount ? parsedTarget : undefined,
          unit: targetCount ? finalUnit : undefined,
          has_timer: targetCount && finalUnit === "minutes" ? hasTimer : false,
          scheduled_time: timeString,
        }),
        // Habit
        ...(defaultType === "habit" && {
          weekly_target: parsedWeekly,
          ...(trackSession && sessionTarget && parseInt(sessionTarget, 10) >= 1 && {
            session_target_count: parseInt(sessionTarget, 10),
            session_unit: sessionUnit === "custom" ? sessionCustomUnit.trim() || "times" : sessionUnit,
            session_has_timer: sessionUnit === "minutes" && sessionHasTimer,
          }),
        }),
      });

      // Schedule notifications for the new daily if it has a scheduled time
      if (defaultType === "daily" && timeString) {
        const ids = await scheduleNotificationsForDaily(
          title,
          timeString,
          scheduledDays
        );
        if (ids.length > 0) {
          await updateTask(user.uid, taskId, { notification_ids: ids });
        }
      }

      resetForm();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setScheduledDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const typeLabel =
    defaultType === "habit" ? "Habit" : defaultType === "daily" ? "Daily" : "To-Do";
  const accentColor =
    defaultType === "habit" ? "bg-violet-electric" :
    defaultType === "daily" ? "bg-cyan-neon" : "bg-green-500";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-dark rounded-t-3xl border-t-4 border-x-4 border-gray-900 max-h-[92%]"
          >
            <ScrollView
              className="p-5"
              contentContainerStyle={{ paddingBottom: 48 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View className="flex-row justify-between items-center mb-5">
                <View className="flex-row items-center gap-2">
                  <View className={`w-2 h-8 ${accentColor} rounded-full border-2 border-gray-900`} />
                  <Text className="text-2xl text-white" style={HEADING_STYLE}>
                    New {typeLabel}
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  className="w-9 h-9 bg-dark-card border-2 border-gray-700 rounded-xl items-center justify-center"
                >
                  <X size={18} color="#9CA3AF" strokeWidth={2.5} />
                </Pressable>
              </View>

              {/* Title */}
              <View className="gap-2 mb-4">
                <Text className="text-sm text-gray-300" style={LABEL_STYLE}>Title *</Text>
                <CartoonInput
                  variant="dark"
                  placeholder={`Name your ${typeLabel.toLowerCase()}...`}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                />
              </View>

              {/* Notes */}
              <View className="gap-2 mb-4">
                <Text className="text-sm text-gray-300" style={LABEL_STYLE}>Notes</Text>
                <CartoonInput
                  variant="dark"
                  placeholder="Optional details..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Difficulty */}
              <View className="gap-2 mb-4">
                <Text className="text-sm text-gray-300" style={LABEL_STYLE}>Difficulty</Text>
                <View className="flex-row gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => setDifficulty(opt.value)}
                      className={`flex-1 border-4 border-gray-900 rounded-2xl py-3 items-center active:scale-95 ${
                        difficulty === opt.value ? opt.color : "bg-dark-card"
                      }`}
                    >
                      <Text
                        className={`text-sm ${difficulty === opt.value ? "text-gray-900" : "text-gray-400"}`}
                        style={LABEL_STYLE}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* ──── DAILY-SPECIFIC FIELDS ──── */}
              {defaultType === "daily" && (
                <>
                  {/* Target count + unit */}
                  <View className="gap-2 mb-4">
                    <Text className="text-sm text-gray-300" style={LABEL_STYLE}>
                      Daily Target <Text className="text-gray-500 font-normal">(optional)</Text>
                    </Text>
                    <View className="flex-row gap-2">
                      <CartoonInput
                        variant="dark"
                        placeholder="e.g. 8"
                        value={targetCount}
                        onChangeText={setTargetCount}
                        keyboardType="numeric"
                        className="flex-1"
                      />
                      <Text className="text-gray-400 self-center text-sm" style={LABEL_STYLE}>×</Text>
                      <View className="flex-1">
                        <CartoonInput
                          variant="dark"
                          placeholder="unit"
                          value={unit === "custom" ? customUnit : unit}
                          onChangeText={(val) => {
                            const match = UNIT_PRESETS.find((u) => u === val.toLowerCase());
                            if (match) setUnit(match);
                            else { setUnit("custom"); setCustomUnit(val); }
                          }}
                        />
                      </View>
                    </View>
                    {/* Unit preset chips */}
                    <View className="flex-row gap-1.5 flex-wrap">
                      {UNIT_PRESETS.map((u) => (
                        <Pressable
                          key={u}
                          onPress={() => { setUnit(u); if (u !== "minutes") setHasTimer(false); }}
                          className={`border-2 border-gray-700 rounded-full px-3 py-1 ${
                            unit === u ? "bg-cyan-neon border-gray-900" : "bg-dark-card"
                          }`}
                        >
                          <Text
                            className={`text-xs ${unit === u ? "text-gray-900" : "text-gray-400"}`}
                            style={LABEL_STYLE}
                          >
                            {u}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Timer toggle (only for minutes unit) */}
                  {unit === "minutes" && targetCount !== "" && (
                    <View className="flex-row items-center justify-between bg-dark-card border-2 border-gray-700 rounded-2xl px-4 py-3 mb-4">
                      <View className="flex-row items-center gap-2">
                        <Clock size={16} color="#22D3EE" strokeWidth={2.5} />
                        <Text className="text-sm text-gray-200" style={LABEL_STYLE}>
                          Use countdown timer
                        </Text>
                      </View>
                      <Switch
                        value={hasTimer}
                        onValueChange={setHasTimer}
                        trackColor={{ false: "#374151", true: "#8B5CF6" }}
                        thumbColor={hasTimer ? "#FFFFFF" : "#9CA3AF"}
                      />
                    </View>
                  )}

                  {/* Scheduled time */}
                  <View className="gap-2 mb-4">
                    <Text className="text-sm text-gray-300" style={LABEL_STYLE}>
                      Scheduled time <Text className="text-gray-500 font-normal">(optional)</Text>
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() => setShowTimePicker(true)}
                        className="flex-1 flex-row items-center gap-2 bg-dark-card border-2 border-gray-700 rounded-xl px-4 py-3 active:opacity-70"
                      >
                        <Clock size={16} color="#9CA3AF" strokeWidth={2} />
                        <Text className="text-sm text-gray-300 flex-1" style={LABEL_STYLE}>
                          {scheduledTime
                            ? scheduledTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "No reminder set"}
                        </Text>
                      </Pressable>
                      {scheduledTime && (
                        <Pressable
                          onPress={() => setScheduledTime(null)}
                          className="w-9 h-9 bg-dark-card border-2 border-gray-700 rounded-xl items-center justify-center active:opacity-70"
                        >
                          <X size={14} color="#9CA3AF" strokeWidth={2} />
                        </Pressable>
                      )}
                    </View>

                    {/* Android: show picker as dialog on button press */}
                    {Platform.OS === "android" && showTimePicker && (
                      <DateTimePicker
                        mode="time"
                        value={scheduledTime ?? new Date()}
                        is24Hour={false}
                        onChange={(_, date) => {
                          setShowTimePicker(false);
                          if (date) setScheduledTime(date);
                        }}
                      />
                    )}

                    {/* iOS: show inline spinner */}
                    {Platform.OS === "ios" && showTimePicker && (
                      <View className="bg-dark-card border-2 border-gray-700 rounded-xl overflow-hidden">
                        <DateTimePicker
                          mode="time"
                          value={scheduledTime ?? new Date()}
                          is24Hour={false}
                          display="spinner"
                          themeVariant="dark"
                          onChange={(_, date) => {
                            if (date) setScheduledTime(date);
                          }}
                        />
                        <Pressable
                          onPress={() => setShowTimePicker(false)}
                          className="mx-4 mb-3 bg-violet-electric border-2 border-gray-900 rounded-xl py-2 items-center active:opacity-70"
                        >
                          <Text className="text-white text-sm" style={LABEL_STYLE}>Done</Text>
                        </Pressable>
                      </View>
                    )}

                    {/* Web: native HTML time input */}
                    {Platform.OS === "web" && showTimePicker && (
                      <input
                        type="time"
                        style={{
                          backgroundColor: "#1F2937",
                          border: "2px solid #374151",
                          borderRadius: 12,
                          color: "#D1D5DB",
                          padding: "10px 14px",
                          fontSize: 14,
                          width: "100%",
                          fontFamily: "Nunito_700Bold",
                        }}
                        value={scheduledTime
                          ? `${String(scheduledTime.getHours()).padStart(2, "0")}:${String(scheduledTime.getMinutes()).padStart(2, "0")}`
                          : ""}
                        onChange={(e) => {
                          const [h, m] = e.target.value.split(":").map(Number);
                          if (!isNaN(h) && !isNaN(m)) {
                            const d = new Date();
                            d.setHours(h, m, 0, 0);
                            setScheduledTime(d);
                            setShowTimePicker(false);
                          }
                        }}
                      />
                    )}
                  </View>

                  {/* Repeat days */}
                  <View className="gap-2 mb-4">
                    <Text className="text-sm text-gray-300" style={LABEL_STYLE}>Repeat on</Text>
                    <View className="flex-row gap-1 flex-wrap">
                      {DAYS.map((day, index) => (
                        <Pressable
                          key={day}
                          onPress={() => toggleDay(index)}
                          className={`border-2 border-gray-900 rounded-xl px-3 py-2 ${
                            scheduledDays.includes(index) ? "bg-cyan-neon" : "bg-dark-card"
                          }`}
                        >
                          <Text
                            className={`text-xs ${scheduledDays.includes(index) ? "text-gray-900" : "text-gray-400"}`}
                            style={LABEL_STYLE}
                          >
                            {day}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* ──── HABIT-SPECIFIC FIELDS ──── */}
              {defaultType === "habit" && (
                <View className="gap-2 mb-4">
                  <Text className="text-sm text-gray-300" style={LABEL_STYLE}>
                    Weekly goal
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <CartoonInput
                      variant="dark"
                      placeholder="3"
                      value={weeklyTarget}
                      onChangeText={setWeeklyTarget}
                      keyboardType="numeric"
                      className="flex-1"
                    />
                    <Text className="text-gray-400 text-sm" style={LABEL_STYLE}>times / week</Text>
                  </View>
                  <View className="flex-row gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <Pressable
                        key={n}
                        onPress={() => setWeeklyTarget(String(n))}
                        className={`flex-1 border-2 border-gray-900 rounded-xl py-2 items-center ${
                          weeklyTarget === String(n) ? "bg-violet-electric" : "bg-dark-card"
                        }`}
                      >
                        <Text
                          className={`text-xs ${weeklyTarget === String(n) ? "text-white" : "text-gray-400"}`}
                          style={LABEL_STYLE}
                        >
                          {n}×
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Session Target */}
                  <View className="flex-row items-center justify-between bg-dark-card border-2 border-gray-700 rounded-2xl px-4 py-3 mt-2">
                    <Text className="text-sm text-gray-200" style={LABEL_STYLE}>
                      Track per-session progress
                    </Text>
                    <Switch
                      value={trackSession}
                      onValueChange={(v) => { setTrackSession(v); if (!v) { setSessionTarget(""); setSessionHasTimer(false); } }}
                      trackColor={{ false: "#374151", true: "#8B5CF6" }}
                      thumbColor={trackSession ? "#FFFFFF" : "#9CA3AF"}
                    />
                  </View>

                  {trackSession && (
                    <View className="gap-2 mt-3">
                      <Text className="text-sm text-gray-300" style={LABEL_STYLE}>
                        Session target
                      </Text>
                      <View className="flex-row gap-2">
                        <CartoonInput
                          variant="dark"
                          placeholder="e.g. 30"
                          value={sessionTarget}
                          onChangeText={setSessionTarget}
                          keyboardType="numeric"
                          className="flex-1"
                        />
                        <Text className="text-gray-400 self-center text-sm" style={LABEL_STYLE}>×</Text>
                        <View className="flex-1">
                          <CartoonInput
                            variant="dark"
                            placeholder="unit"
                            value={sessionUnit === "custom" ? sessionCustomUnit : sessionUnit}
                            onChangeText={(val) => {
                              const match = UNIT_PRESETS.find((u) => u === val.toLowerCase());
                              if (match) setSessionUnit(match);
                              else { setSessionUnit("custom"); setSessionCustomUnit(val); }
                            }}
                          />
                        </View>
                      </View>
                      <View className="flex-row gap-1.5 flex-wrap">
                        {UNIT_PRESETS.map((u) => (
                          <Pressable
                            key={u}
                            onPress={() => { setSessionUnit(u); if (u !== "minutes") setSessionHasTimer(false); }}
                            className={`border-2 border-gray-700 rounded-full px-3 py-1 ${
                              sessionUnit === u ? "bg-violet-electric border-gray-900" : "bg-dark-card"
                            }`}
                          >
                            <Text
                              className={`text-xs ${sessionUnit === u ? "text-white" : "text-gray-400"}`}
                              style={LABEL_STYLE}
                            >
                              {u}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      {sessionUnit === "minutes" && sessionTarget !== "" && (
                        <View className="flex-row items-center justify-between bg-dark-card border-2 border-gray-700 rounded-2xl px-4 py-3">
                          <View className="flex-row items-center gap-2">
                            <Clock size={16} color="#8B5CF6" strokeWidth={2.5} />
                            <Text className="text-sm text-gray-200" style={LABEL_STYLE}>
                              Use countdown timer
                            </Text>
                          </View>
                          <Switch
                            value={sessionHasTimer}
                            onValueChange={setSessionHasTimer}
                            trackColor={{ false: "#374151", true: "#8B5CF6" }}
                            thumbColor={sessionHasTimer ? "#FFFFFF" : "#9CA3AF"}
                          />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Error */}
              {error ? (
                <Text
                  className="text-red-400 text-sm text-center mb-3"
                  style={{ fontFamily: "Nunito_600SemiBold" }}
                >
                  {error}
                </Text>
              ) : null}

              {/* Save */}
              <CartoonButton
                title={saving ? "Creating..." : `Create ${typeLabel}`}
                variant="violet"
                size="lg"
                onPress={handleSave}
                disabled={saving}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
