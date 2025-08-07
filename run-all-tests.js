// 모든 시스템 테스트 통합 실행 스크립트
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 가챠 무인 판매기 장치 등록 시스템 - 전체 테스트 실행\n');
console.log('=' .repeat(60));

// 샘플 데이터 정보 출력
const sampleData = JSON.parse(fs.readFileSync('./sample-data.json', 'utf8'));

console.log('📊 샘플 데이터 요약:');
console.log(`   - 등록 요청 샘플: ${sampleData.deviceRegistrationRequests.length}개`);
console.log(`   - 기존 장치: ${sampleData.existingDevices.length}개`);
console.log(`   - 관리자 계정: ${sampleData.adminUsers.length}개`);
console.log(`   - 테스트 시나리오: ${Object.keys(sampleData.testScenarios).length}개`);
console.log(`   - API 엔드포인트: ${Object.keys(sampleData.apiEndpoints).length}개\n`);

// 각 시스템별 테스트 실행
const tests = [
  {
    name: 'gachaGeminiV2 (단일 파일 구조)',
    file: 'test-gachaGeminiV2.js',
    command: 'node test-gachaGeminiV2.js'
  },
  {
    name: 'gachaGptV2 (NestJS 구조)', 
    file: 'test-gachaGptV2.ts',
    command: 'npx ts-node test-gachaGptV2.ts'
  },
  {
    name: 'gachaClaudeV2 (Express 구조)',
    file: 'test-gachaClaudeV2.ts', 
    command: 'npx ts-node test-gachaClaudeV2.ts'
  }
];

tests.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name} 테스트 실행`);
  console.log('-'.repeat(50));
  
  try {
    if (fs.existsSync(test.file)) {
      console.log(`실행 명령어: ${test.command}\n`);
      // 실제 실행은 주석 처리 (의존성 문제로 인해)
      // execSync(test.command, { stdio: 'inherit' });
      console.log(`✅ ${test.file} 파일이 준비되었습니다.`);
      console.log(`   직접 실행하려면: ${test.command}`);
    } else {
      console.log(`❌ ${test.file} 파일을 찾을 수 없습니다.`);
    }
  } catch (error) {
    console.log(`❌ ${test.name} 테스트 실행 중 오류 발생:`);
    console.log(error.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📋 실행 방법:');
console.log('1. Node.js 테스트: node test-gachaGeminiV2.js');
console.log('2. TypeScript 테스트 (ts-node 필요):');
console.log('   - npx ts-node test-gachaGptV2.ts');
console.log('   - npx ts-node test-gachaClaudeV2.ts');
console.log('\n💡 ts-node 설치: npm install -g ts-node typescript');
console.log('='.repeat(60));