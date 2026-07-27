export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
}

export function calculateDaysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getBuildingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    APT: '아파트',
    OFFICETEL: '오피스텔',
    OFFICE: '사무실',
    STORE: '상가',
    FACTORY: '공장',
    ETC: '기타',
  };
  return labels[type] || type;
}

export function getDayLabel(day: string): string {
  const labels: Record<string, string> = {
    MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일',
  };
  return labels[day] || day;
}