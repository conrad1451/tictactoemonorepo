// frontend/src/services/api.ts

// CHQ: Claude AI (Haiku) generated file

// source: https://www.google.com/search?client=firefox-b-1-d&q=Property+%27env%27+does+not+exist+on+type+%27ImportMeta%27.&fbs=ABfTbFVyMZGZf1hfvX9uKjN_-G8cxpBkeIeqYwoCbfNVc4vKE-Dsslc-KGKq55jF_BVsFlCZ_qea3ZQNMU_L5SWbG8ROva_LKGdZoPsB7f_pNLAVJXfjUUevW1MGN8kGASBEENKSw5jez3QKVTgFG3uNig5lty5HLdHwdwNuFe6gusNikALPrGed9kFpvNm1TktJ9YCaoz5K-rXQwMkmag2DSr_PnWRPhA&aep=10&ntc=1&sxsrf=APpeQnvAGBupxpuvszK9HbGahB9_goP44A%3A1787574096995&mstk=AUtExfBU9ktY2GmlUzJeij2Vj6C_4SzNti3jHF7qMES8Wlf93oME415a13ut_p90aFhsCPTn1rk2RN9XLDsC_T4OFGg-EIa4l95TOz8zOoKxDKP9vQourwPQF_RRXGelBHJXNyQUzciJG7D_e-zQF0FZgViAudLjiY-3UziaOkojmo3aVbU3YBDb3lSkOQD4KWqjBxJOcURKHzXuIRo8AT-gc19XAMYGGIuyVlLkySl8uqsqkBFlBq0mNCoq0g1Uf4eUv86i6z_tXTsMSw&aioh=3&csuir=1&atvm=2&mtid=7lOMarezH8uV5OMPhcq5yA0&udm=50
// Thin wiring of the real environment into the testable client.

import { getAuthUser } from "./auth";
import { createApiClient } from "./apiClient";

export const getAuthToken = (): string | null => getAuthUser()?.sessionJwt ?? null;

export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL_WITH_API_SUFFIX || "http://localhost:5000/api",
  getToken: getAuthToken,
});

export const { saveScore, getLeaderboard, getUserStats, verifyAuth, getMe, setUsername } = api;
