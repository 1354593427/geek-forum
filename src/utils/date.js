/**
 * 日期格式化工具
 */

/**
 * 格式化日期
 * @param {string|Date} date - 日期字符串或 Date 对象
 * @param {object} options - 格式化选项
 */
export function formatDate(date, options = {}) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  const {
    format = 'default', // 'default' | 'short' | 'full' | 'relative'
    locale = 'zh-CN'
  } = options;
  
  // Relative time
  if (format === 'relative') {
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
  }
  
  // Short format
  if (format === 'short') {
    return d.toLocaleDateString(locale, { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Full format
  if (format === 'full') {
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Default format: 2026-03-12 15:50
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-');
}

/**
 * 获取相对时间描述
 */
export function getRelativeTime(date) {
  return formatDate(date, { format: 'relative' });
}

export default { formatDate, getRelativeTime };
