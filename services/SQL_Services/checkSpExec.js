const CheckImo={ 
    'performance.dbo.MRV_Prepare_Gunvor':['9892133','9349007','9946829'],
    'performance.dbo.MRV_Prepare_Clearlake':['9389289','9868780','9877573'],
}


 
async function CheckforSpExec(IMO) {
    for (const [sp, imoList] of Object.entries(CheckImo)) {
        if (imoList.includes(IMO)) {
            // Match found, execute or return the stored procedure name
            return sp;
        }
    }
    // If no match is found, return null or handle accordingly
    return null;
}

//async function main() {
//    try {
//        const result = await CheckforSpExec('939289');
//        if (result) {
//            console.log(result); // Output: 'performance.dbo.MRV_Prepare_Clearlake'
//        } else {
//            console.log('No match found');
//        }
//    } catch (error) {
//        console.error('Error:', error);
//    }
//}
//
//main();
// 
  
module.exports={CheckforSpExec}