   
   

  async function CheckValue(columnName,value) {
    if ( value === undefined && value === null) {
        return null;
      } else if (typeof value === 'string') {
        return `[${columnName}] = '${value.replace(/'/g, "''")}'`;
      }else if (typeof value === 'boolean') {
        return `[${columnName}] = ${value ? '1' : '0'}`;
      }  else if (value instanceof Date) {
        return `[${columnName}] = '${value.toISOString().slice(0, 19).replace('T', ' ')}'`; // Assuming SQL Server datetime format
      } else {
        return `[${columnName}] = ${value}`;
      }
  }
   
   module.exports= CheckValue