export function formatCSV(str, delimiter = ',') {
  if (str.length === 0) return []
  let data = []
  let arr = str.split(/\n|\r/)
  let header = arr[0].split(delimiter)
  for (let i = 1; i < arr.length; i++) {
    let temp = arr[i].split(delimiter)
    let obj = {}
    temp.forEach((item, index) => {
      obj[header[index]] = item
    })
    data.push(obj)
  }
  return data
}

export function formatDate(date, format = 'yyyy-MM-dd HH:mm:ss') {
  date = new Date(/^\d+$/.test(date) ? parseInt(date) : date);
  if (isNaN(date.getTime())) return;
  let dateObj = {
    'y+': date.getFullYear(),
    "M+": date.getMonth() + 1,
    'd+': date.getDate(),
    'H+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  }
  for (let key in dateObj) {
    let reg = new RegExp('(' + key + ')');
    format = format.replace(reg, match => {
      return ("00" + dateObj[key]).substr(-match.length)
    })
  }
  return format
}

export function formatNumber(num, decimal = 2, thousands = true) {
  num = parseFloat(num);
  if (isNaN(num)) return ""
  num = parseFloat(num.toFixed(decimal));
  if (thousands && num) {
    let arr = num.toString().split('.');
    arr[0] = arr[0].replace(/(\d)(?=(\d{3})+$)/g, "$1,");
    return arr.join(".")
  }
  return num
}