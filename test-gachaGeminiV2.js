// gachaGeminiV2 시스템 테스트
const fs = require('fs');

// 샘플 데이터 로드
const sampleData = JSON.parse(fs.readFileSync('./sample-data.json', 'utf8'));

console.log('=== gachaGeminiV2 시스템 테스트 ===\n');

// 1. 장치 등록 요청 테스트
console.log('📱 장치 등록 요청 샘플:');
sampleData.deviceRegistrationRequests.forEach((device, index) => {
  console.log(`${index + 1}. ${device.hardwareId}`);
  console.log(`   - 테넌트: ${device.tenantId}`);
  console.log(`   - IP: ${device.ipAddress}`);
  console.log(`   - OS: ${device.systemInfo.os} ${device.systemInfo.version}`);
  console.log(`   - 메모리: ${device.systemInfo.memory}, 저장소: ${device.systemInfo.storage}\n`);
});

// 2. 기존 장치 상태별 출력
console.log('📊 기존 장치 상태별 현황:');
const devicesByStatus = sampleData.existingDevices.reduce((acc, device) => {
  acc[device.status] = (acc[device.status] || 0) + 1;
  return acc;
}, {});

Object.entries(devicesByStatus).forEach(([status, count]) => {
  const statusKor = {
    'approved': '승인됨',
    'rejected': '거부됨', 
    'pending': '대기중'
  };
  console.log(`   ${statusKor[status]}: ${count}개`);
});

console.log('\n🔍 장치 상세 정보:');
sampleData.existingDevices.forEach(device => {
  console.log(`- ${device.hardwareId} (${device.status})`);
  if (device.status === 'approved') {
    console.log(`  ✅ 승인됨 - 큐 URL: ${device.sqsQueueUrl.substring(0, 50)}...`);
  } else if (device.status === 'rejected') {
    console.log(`  ❌ 거부됨 - 사유: ${device.rejectionReason}`);
  } else {
    console.log(`  ⏳ 대기중 - 등록일: ${device.createdAt}`);
  }
});

// 3. 테스트 시나리오 실행
console.log('\n🧪 테스트 시나리오:');
console.log('1. 정상 등록 테스트:');
console.log(`   요청: ${sampleData.testScenarios.validRegistration.request.hardwareId}`);
console.log(`   예상 응답: ${sampleData.testScenarios.validRegistration.expectedResponse.message}`);

console.log('\n2. 중복 등록 테스트:');
console.log(`   요청: ${sampleData.testScenarios.duplicateRegistration.request.hardwareId}`);
console.log(`   예상 응답: ${sampleData.testScenarios.duplicateRegistration.expectedResponse.message}`);

console.log('\n3. 상태 확인 테스트:');
console.log(`   승인된 장치: ${sampleData.testScenarios.statusCheck.approved.hardwareId}`);
console.log(`   대기중 장치: ${sampleData.testScenarios.statusCheck.pending.hardwareId}`);
console.log(`   없는 장치: ${sampleData.testScenarios.statusCheck.notFound.hardwareId}`);

console.log('\n=== 테스트 완료 ===');