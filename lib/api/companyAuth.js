import { apiRequest, setCompanyToken, removeCompanyToken } from "./client";

export async function registerCompany({
  company_name,
  reg_number = "VN-" + Date.now().toString().slice(-6),
  tax_id,
  industry = "Technology",
  size = "11-50",
  website = "https://example.com",
  contact_name,
  email,
  password,
  phone = "",
}) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: {
      company_name,
      reg_number: tax_id || reg_number,
      tax_id: tax_id || reg_number,
      tax_code: tax_id || reg_number,
      industry,
      size,
      website,
      contact_name,
      full_name: contact_name,
      user_type: "company",
      email,
      password,
      phone,
    },
  });
  if (data?.data?.access_token) {
    setCompanyToken(data.data.access_token);
  }
  return data;
}

export async function verifyCompanyEmail({ email, code }) {
  return apiRequest("/auth/verify-email", {
    method: "POST",
    body: { email, code },
    authType: "company",
  });
}

export async function sendCompanyVerificationEmail({ email }) {
  return apiRequest("/auth/send-verification-email", {
    method: "POST",
    body: { email },
    authType: "company",
  });
}

export async function standardCompanyLogin({ email, password }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const token = data?.data?.access_token || data?.access_token;
  if (token) {
    setCompanyToken(token);
  }
  return data;
}

export async function initiateCompanyLogin({ email, password }) {
  return apiRequest("/auth/login/initiate", {
    method: "POST",
    body: { email, password },
  });
}

export async function verifyCompanyOtp({ session_token, code }) {
  const data = await apiRequest("/auth/login/verify-otp", {
    method: "POST",
    body: { session_token, code },
  });
  const token = data?.data?.access_token || data?.access_token;
  if (token) {
    setCompanyToken(token);
  }
  return data;
}

export async function getInvitationByToken(token) {
  return apiRequest(`/auth/invite/${token}`, {
    method: "GET",
  });
}

export async function activateTeamInvitation({ invite_token, name, password }) {
  const res = await apiRequest("/auth/activate-invite", {
    method: "POST",
    body: { invite_token, name, password },
  });
  const data = res?.data || res;
  if (data?.access_token) {
    setCompanyToken(data.access_token);
  }
  return data;
}

export async function getCompanyMe() {
  return apiRequest("/auth/me", {
    method: "GET",
    authType: "company",
  });
}

export function logoutCompany() {
  removeCompanyToken();
}

/**
 * Validates a Vietnamese Business Code / Tax ID using backend API with VietQR National Business Registry.
 * API: https://api.vietqr.io/v2/business/{tax_id}
 */
export async function validateCompanyTaxId(taxId) {
  const cleanId = String(taxId || "").replace(/[^0-9\-]/g, "").trim();
  if (!cleanId || cleanId.length < 8) {
    return { valid: false, error: "Tax ID must be at least 8 digits" };
  }

  // 1. Query backend endpoint
  try {
    const res = await apiRequest(`/auth/validate-tax-id/${encodeURIComponent(cleanId)}`, {
      method: "GET",
    });
    const data = res?.data || res;
    if (data && typeof data.valid === "boolean") {
      if (data.valid && data.business) {
        data.englishProfile = getEnglishBusinessProfile(data.business);
      }
      return data;
    }
  } catch (err) {
    // Backend fallback
  }

  // 2. Query Next.js internal API proxy (server-side, avoids browser CORS)
  try {
    const localRes = await fetch(`/api/business/${encodeURIComponent(cleanId)}`);
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData && typeof localData.valid === "boolean") {
        if (localData.valid && localData.business) {
          localData.englishProfile = getEnglishBusinessProfile(localData.business);
        }
        return localData;
      }
    }
  } catch (err) {
    // Proxy fallback
  }

  // 3. Direct VietQR fallback
  try {
    const resp = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(cleanId)}`);
    const json = await resp.json();
    if (json && json.code === "00" && json.data) {
      return {
        valid: true,
        tax_id: cleanId,
        business: json.data,
        englishProfile: getEnglishBusinessProfile(json.data),
        message: "Tax ID is valid and verified in Vietnam National Business Registry",
      };
    }
    return {
      valid: false,
      tax_id: cleanId,
      business: null,
      englishProfile: null,
      error: json?.desc || "Tax ID not found or invalid in Vietnam Business Registry",
    };
  } catch (err) {
    return {
      valid: false,
      tax_id: cleanId,
      business: null,
      englishProfile: null,
      error: "Unable to reach business verification service",
    };
  }
}

/**
 * Transforms Vietnamese business registry data into structured English profile data.
 * API VietQR provides `internationalName`, `shortName`, and `name`.
 */
export function getEnglishBusinessProfile(business) {
  if (!business) return null;

  // 1. Direct official English/International name registered with authorities
  let englishName = business.internationalName?.trim() || business.shortName?.trim();

  // 2. If no official international name, convert Vietnamese registered legal name to English
  if (!englishName && business.name) {
    const raw = business.name.trim();

    if (/viettel/i.test(raw) || /quân đội/i.test(raw)) {
      englishName = "Viettel Military Industry and Telecoms Group";
    } else {
      const removeAccents = (str) =>
        str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D");

      let cleaned = removeAccents(raw);

      cleaned = cleaned
        .replace(/^TAP DOAN\s+/i, "")
        .replace(/^CONG TY CO PHAN\s+/i, "")
        .replace(/^CONG TY TNHH MOT THANH VIEN\s+/i, "")
        .replace(/^CONG TY TNHH MTV\s+/i, "")
        .replace(/^CONG TY TNHH\s+/i, "")
        .replace(/^CONG TY CP\s+/i, "")
        .replace(/\s*-\s*CONG TY CP$/i, "")
        .replace(/\s*-\s*CONG TY TNHH$/i, "")
        .trim();

      if (/^TẬP ĐOÀN|TAP DOAN|GROUP/i.test(raw)) {
        englishName = `${cleaned} Group`;
      } else if (/CỔ PHẦN|CO PHAN|CP/i.test(raw)) {
        englishName = `${cleaned} Joint Stock Company`;
      } else if (/TNHH|LIMITED/i.test(raw)) {
        englishName = `${cleaned} Company Limited`;
      } else {
        englishName = cleaned;
      }
    }
  }

  // Detect English Industry
  const fullText = `${business.name || ""} ${business.internationalName || ""} ${business.shortName || ""}`.toLowerCase();
  let detectedIndustry = null;
  if (/software|technology|tech|digital|telecom|viễn thông|công nghệ|tin học|fpt|viettel|vnpt/i.test(fullText)) {
    detectedIndustry = "Technology";
  } else if (/manufacturing|sản xuất|chế biến|chế tạo|cơ khí|thực phẩm|dairy|milk|sữa|vinamilk|food/i.test(fullText)) {
    detectedIndustry = "Manufacturing";
  } else if (/retail|commerce|thương mại|bán lẻ|supermarket|mart|shop|vingroup|vinmart/i.test(fullText)) {
    detectedIndustry = "Retail & Commerce";
  } else if (/logistics|transport|vận tải|giao nhận|chuyển phát|cảng|shipping/i.test(fullText)) {
    detectedIndustry = "Transport & Logistics";
  } else if (/finance|bank|ngân hàng|tài chính|securities|chứng khoán|insurance|bảo hiểm/i.test(fullText)) {
    detectedIndustry = "Finance & Banking";
  } else if (/media|creative|truyền thông|quảng cáo|entertainment|giải trí/i.test(fullText)) {
    detectedIndustry = "Media & Creative";
  }

  // Detect English Company Size
  let detectedSize = null;
  if (/corporation|group|tập đoàn|vinamilk|fpt|viettel|vingroup/i.test(fullText)) {
    detectedSize = "500+";
  } else if (/joint stock|cổ phần|cp/i.test(fullText)) {
    detectedSize = "51–200";
  } else if (/tnhh|limited/i.test(fullText)) {
    detectedSize = "11–50";
  }

  // Extract English City from Address
  const addr = business.address || "";
  let englishCity = null;
  if (/hà nội|ha noi/i.test(addr)) englishCity = "Hanoi, Vietnam";
  else if (/hồ chí minh|ho chi minh|tp\.hcm|sài gòn/i.test(addr)) englishCity = "Ho Chi Minh City, Vietnam";
  else if (/đà nẵng|da nang/i.test(addr)) englishCity = "Da Nang, Vietnam";
  else if (/hải phòng|hai phong/i.test(addr)) englishCity = "Hai Phong, Vietnam";
  else if (/cần thơ|can tho/i.test(addr)) englishCity = "Can Tho, Vietnam";
  else if (/bình dương|binh duong/i.test(addr)) englishCity = "Binh Duong, Vietnam";

  return {
    englishName: englishName?.trim() || business.name,
    shortName: business.shortName?.trim(),
    vietnameseName: business.name?.trim(),
    industry: detectedIndustry,
    size: detectedSize,
    city: englishCity,
    address: business.address,
    status: business.status,
  };
}
