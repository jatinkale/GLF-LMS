-- Leave Balance Update Script for November 2025
-- Generated on: 2025-12-09T13:57:54.163Z
-- This script updates leave balances for employees based on the Excel file

-- Start transaction
START TRANSACTION;

-- Update for Employee: Abhay Singh (T 198)
UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'T 198'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'T 198'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Aditi Sharma (Z1408)
UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1408'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1408'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Ajay Mattani (Z1366)
UPDATE leave_balances
SET allocated = 23,
    available = 23,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1366'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 4,
    available = 4,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1366'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Amruta Vedpathak (Z1351)
UPDATE leave_balances
SET allocated = 26,
    available = 26,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1351'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 5.5,
    available = 5.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1351'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Anant Khandkole (Z1287)
UPDATE leave_balances
SET allocated = 41,
    available = 41,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1287'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 8,
    available = 8,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1287'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Anantkumar Patil (Z1268)
UPDATE leave_balances
SET allocated = 24.5,
    available = 24.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1268'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1268'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Aniket Borgaonkar (Z1380)
UPDATE leave_balances
SET allocated = 6,
    available = 6,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1380'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1380'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Aparna Likhitkar (Z1344)
UPDATE leave_balances
SET allocated = 33,
    available = 33,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1344'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1.5,
    available = 1.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1344'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Arjun Nikam (Z1149)
UPDATE leave_balances
SET allocated = 24,
    available = 24,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1149'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1149'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Asharani Belanke (Z1202)
UPDATE leave_balances
SET allocated = 3,
    available = 3,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1202'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1202'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Ashish Kamble (Z1203)
UPDATE leave_balances
SET allocated = 15,
    available = 15,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1203'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 8,
    available = 8,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1203'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Aashish Kulkarni (Z1391)
UPDATE leave_balances
SET allocated = 9,
    available = 9,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1391'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 6,
    available = 6,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1391'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Ashish Sharma (Z1388)
UPDATE leave_balances
SET allocated = 1.5,
    available = 1.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1388'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1388'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Ashok Menon (Z1378)
UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1378'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1378'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Ashwini Kale (Z1256)
UPDATE leave_balances
SET allocated = 6,
    available = 6,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1256'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 7,
    available = 7,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1256'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Batul Khandwala (Z1139)
UPDATE leave_balances
SET allocated = 4,
    available = 4,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1139'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1139'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Bhavana Mahajan (Z1292)
UPDATE leave_balances
SET allocated = 15.5,
    available = 15.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1292'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1292'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Chetan Mali (Z1316)
UPDATE leave_balances
SET allocated = 27,
    available = 27,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1316'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1316'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Dhanashri Chavan (Z1307)
UPDATE leave_balances
SET allocated = 12,
    available = 12,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1307'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1307'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Divya Sudheer (Z1340)
UPDATE leave_balances
SET allocated = 12,
    available = 12,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1340'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0.5,
    available = 0.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1340'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Durga Nimgire (Z1308)
UPDATE leave_balances
SET allocated = 6,
    available = 6,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1308'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1308'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Elizabeth Pathipallil (Z1402)
UPDATE leave_balances
SET allocated = 5,
    available = 5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1402'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1402'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Janhavi Dixit (Z1200)
UPDATE leave_balances
SET allocated = 8,
    available = 8,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1200'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1200'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Jatin Kale (Z1269)
UPDATE leave_balances
SET allocated = 21.5,
    available = 21.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1269'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1269'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Judith Peters (Z1206)
UPDATE leave_balances
SET allocated = 25.5,
    available = 25.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1206'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1206'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Kiran Murkute (Z1343)
UPDATE leave_balances
SET allocated = 12,
    available = 12,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1343'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1343'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Kirti Shivramwar (Z1303)
UPDATE leave_balances
SET allocated = 6,
    available = 6,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1303'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1303'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Komal Jangid (Z1279)
UPDATE leave_balances
SET allocated = 32.5,
    available = 32.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1279'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1279'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Manisha Dhaygude (Z1205)
UPDATE leave_balances
SET allocated = 28.5,
    available = 28.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1205'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1205'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Manisha Tembhurney (Z1267)
UPDATE leave_balances
SET allocated = 14.5,
    available = 14.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1267'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1267'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Maya Kela (Z1310)
UPDATE leave_balances
SET allocated = 12,
    available = 12,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1310'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1310'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Mayur Waghamode (Z1217)
UPDATE leave_balances
SET allocated = 33,
    available = 33,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1217'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1217'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Mayuri Kate (Z1321)
UPDATE leave_balances
SET allocated = 17,
    available = 17,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1321'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1321'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Mayuri Phulsundar (Z1322)
UPDATE leave_balances
SET allocated = 28.5,
    available = 28.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1322'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1322'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Meera Chandaria (Z1036)
UPDATE leave_balances
SET allocated = 3.5,
    available = 3.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1036'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1036'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Nancy George (Z1404)
UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1404'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1404'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Nishant Shetty (Z1401)
UPDATE leave_balances
SET allocated = 8,
    available = 8,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1401'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1.5,
    available = 1.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1401'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Onkar Tajane (Z1345)
UPDATE leave_balances
SET allocated = 12,
    available = 12,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1345'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1345'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Pooja Shedutkar (Z1113)
UPDATE leave_balances
SET allocated = 11,
    available = 11,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1113'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1113'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Pranav Tryambake (Z1405)
UPDATE leave_balances
SET allocated = 2.5,
    available = 2.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1405'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1405'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Pranjali Padole (Z1259)
UPDATE leave_balances
SET allocated = 4,
    available = 4,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1259'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1259'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Pravin Patekar (Z1379)
UPDATE leave_balances
SET allocated = 16,
    available = 16,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1379'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 3,
    available = 3,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1379'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Priya Oak (Z1192)
UPDATE leave_balances
SET allocated = 22.5,
    available = 22.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1192'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1192'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Priyanka Turakane (Z1233)
UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1233'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1233'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Rajat Ruikar (Z1384)
UPDATE leave_balances
SET allocated = 9.5,
    available = 9.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1384'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1384'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Ram Ambhore (Z1312)
UPDATE leave_balances
SET allocated = 6.5,
    available = 6.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1312'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1312'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Ranjit Kadam (Z1392)
UPDATE leave_balances
SET allocated = 3.5,
    available = 3.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1392'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1392'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Richa Malhotra (T 199)
UPDATE leave_balances
SET allocated = 4.5,
    available = 4.5,
    used = 0,
    pending = 0
WHERE employeeId = 'T 199'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1.5,
    available = 1.5,
    used = 0,
    pending = 0
WHERE employeeId = 'T 199'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Ritika Dubey (Z1327)
UPDATE leave_balances
SET allocated = 24.5,
    available = 24.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1327'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1327'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Roopali Shilimkar (T 197)
UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'T 197'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'T 197'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Rupesh Nirmal (Z1207)
UPDATE leave_balances
SET allocated = 26,
    available = 26,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1207'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 9,
    available = 9,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1207'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Rupesh Pawar (Z1004)
UPDATE leave_balances
SET allocated = 39,
    available = 39,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1004'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1004'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Rushikesh Mudshinge (Z1328)
UPDATE leave_balances
SET allocated = 29,
    available = 29,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1328'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1328'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Saba Shaikh (Z1364)
UPDATE leave_balances
SET allocated = 16,
    available = 16,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1364'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1364'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Sakshi Patil (Z1329)
UPDATE leave_balances
SET allocated = 24,
    available = 24,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1329'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1.5,
    available = 1.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1329'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Salehabegam Mulla (Z1333)
UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1333'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1333'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Samruddhi Joshi (Z1281)
UPDATE leave_balances
SET allocated = 9,
    available = 9,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1281'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1281'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Sandeep Kusekar (Z1181)
UPDATE leave_balances
SET allocated = 18.5,
    available = 18.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1181'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1181'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Sandesh Awachat (Z1362)
UPDATE leave_balances
SET allocated = 32,
    available = 32,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1362'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1362'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Sayali Dikav (Z1381)
UPDATE leave_balances
SET allocated = 4.5,
    available = 4.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1381'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1381'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Shraddha Kulkarni (Z1282)
UPDATE leave_balances
SET allocated = 9,
    available = 9,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1282'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1282'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Shradha Malwadkar (Z1243)
UPDATE leave_balances
SET allocated = 1.5,
    available = 1.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1243'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1243'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Shreedhar Todkar (Z1330)
UPDATE leave_balances
SET allocated = 5,
    available = 5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1330'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1330'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Shriya Kavade (Z1224)
UPDATE leave_balances
SET allocated = 12.5,
    available = 12.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1224'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0.5,
    available = 0.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1224'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Shruti Rokade (Z1304)
UPDATE leave_balances
SET allocated = 14.5,
    available = 14.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1304'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1304'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Shubham Bhonde (Z1331)
UPDATE leave_balances
SET allocated = 26,
    available = 26,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1331'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1331'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Shubham Lekule (Z1408)
UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1408'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1408'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Shweta Shetty (Z1228)
UPDATE leave_balances
SET allocated = 12,
    available = 12,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1228'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 2.5,
    available = 2.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1228'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Sneha Pathak (Z1353)
UPDATE leave_balances
SET allocated = 15,
    available = 15,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1353'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1353'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Soham Deshmukh (Z1383)
UPDATE leave_balances
SET allocated = 13.5,
    available = 13.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1383'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 8,
    available = 8,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1383'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Sonali Khairnar (Z1232)
UPDATE leave_balances
SET allocated = 23,
    available = 23,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1232'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1232'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Soumya Tiwari (Z1407)
UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1407'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1407'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Sukrut Kulkarni (Z1403)
UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1403'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1403'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Suraj Kadam (Z1313)
UPDATE leave_balances
SET allocated = 7.5,
    available = 7.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1313'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1313'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Sweta Singh (Z1180)
UPDATE leave_balances
SET allocated = 23.5,
    available = 23.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1180'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1180'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Tejal Pokale (Z1101)
UPDATE leave_balances
SET allocated = 3.5,
    available = 3.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1101'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0.5,
    available = 0.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1101'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Tejal Veer (Z1336)
UPDATE leave_balances
SET allocated = 3.5,
    available = 3.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1336'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1336'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Tejas Satapute (Z1314)
UPDATE leave_balances
SET allocated = 30,
    available = 30,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1314'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1314'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Tushar Patil (Z1397)
UPDATE leave_balances
SET allocated = 4,
    available = 4,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1397'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1397'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Vaishnavi Goilkar (T 196)
UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'T 196'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'T 196'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Vaishnavi Sathe (Z1245)
UPDATE leave_balances
SET allocated = 13,
    available = 13,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1245'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1245'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Vandana Mulchandani (Z1007)
UPDATE leave_balances
SET allocated = 34,
    available = 34,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1007'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 2,
    available = 2,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1007'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Varsha Bogawat (Z1354)
UPDATE leave_balances
SET allocated = 26.5,
    available = 26.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1354'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 1,
    available = 1,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1354'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Vasudha Sontakke (Z1400)
UPDATE leave_balances
SET allocated = 3.5,
    available = 3.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1400'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1400'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Viraj Ghatage (Z1337)
UPDATE leave_balances
SET allocated = 23,
    available = 23,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1337'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1337'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Vishakha Kambale (Z1315)
UPDATE leave_balances
SET allocated = 6,
    available = 6,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1315'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1315'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Vishal Kadam (Z1034)
UPDATE leave_balances
SET allocated = 22.5,
    available = 22.5,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1034'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1034'
  AND leaveTypeCode = 'CL'
  AND year = 2025;


-- Update for Employee: Vishwaja Rathod (Z1114)
UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1114'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

UPDATE leave_balances
SET allocated = 0,
    available = 0,
    used = 0,
    pending = 0
WHERE employeeId = 'Z1114'
  AND leaveTypeCode = 'CL'
  AND year = 2025;



-- Commit transaction
COMMIT;

-- Summary:
-- Total updates: 176
-- Date: 2025-12-09T13:57:54.163Z
