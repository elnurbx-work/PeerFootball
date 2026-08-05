import { FOOTBALL_POSITIONS } from "@/lib/football-positions";
import type { Locale } from "@/i18n/config";

export const AZERBAIJAN_CITIES = [
  "Bakı",
  "Sumqayıt",
  "Gəncə",
  "Xırdalan",
  "Mingəçevir",
  "Naxçıvan",
  "Lənkəran",
  "Şəki",
  "Şirvan",
  "Şamaxı",
  "Qəbələ",
  "Quba",
  "Qusar",
  "Xaçmaz",
  "Salyan",
  "Sabirabad",
  "Bərdə",
  "Ağcabədi",
  "Ağdam",
  "Füzuli",
  "Şuşa",
  "Xankəndi",
  "Yevlax",
  "Naftalan",
  "Zaqatala",
  "Balakən",
  "Masallı",
  "Astara",
  "Cəlilabad",
  "Göyçay"
] as const;

export const PROFILE_POSITIONS = FOOTBALL_POSITIONS;

type ProfilePosition = (typeof PROFILE_POSITIONS)[number];

const POSITION_NAMES: Record<Locale, Record<ProfilePosition, string>> = {
  az: {
    GK: "Qapıçı", CB: "Mərkəz müdafiəçisi", LB: "Sol müdafiəçi", RB: "Sağ müdafiəçi",
    LWB: "Sol cinah müdafiəçisi", RWB: "Sağ cinah müdafiəçisi", CDM: "Dayaq yarımmüdafiəçisi",
    CM: "Mərkəz yarımmüdafiəçisi", CAM: "Hücuma meyilli yarımmüdafiəçi", LM: "Sol yarımmüdafiəçi",
    RM: "Sağ yarımmüdafiəçi", LW: "Sol cinah hücumçusu", RW: "Sağ cinah hücumçusu",
    CF: "İkinci hücumçu", ST: "Mərkəz hücumçusu", OTHER: "Digər"
  },
  en: {
    GK: "Goalkeeper", CB: "Centre-back", LB: "Left-back", RB: "Right-back",
    LWB: "Left wing-back", RWB: "Right wing-back", CDM: "Defensive midfielder",
    CM: "Central midfielder", CAM: "Attacking midfielder", LM: "Left midfielder",
    RM: "Right midfielder", LW: "Left winger", RW: "Right winger",
    CF: "Second striker", ST: "Striker", OTHER: "Other"
  },
  ru: {
    GK: "Вратарь", CB: "Центральный защитник", LB: "Левый защитник", RB: "Правый защитник",
    LWB: "Левый фланговый защитник", RWB: "Правый фланговый защитник", CDM: "Опорный полузащитник",
    CM: "Центральный полузащитник", CAM: "Атакующий полузащитник", LM: "Левый полузащитник",
    RM: "Правый полузащитник", LW: "Левый вингер", RW: "Правый вингер",
    CF: "Оттянутый нападающий", ST: "Нападающий", OTHER: "Другое"
  }
};

export function getPositionLabel(position: ProfilePosition, locale: Locale) {
  return `${position} — ${POSITION_NAMES[locale][position]}`;
}
