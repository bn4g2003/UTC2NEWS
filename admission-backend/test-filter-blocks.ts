const API_URL = 'http://localhost:3000/api';
const SESSION_ID = '606fc914-b151-4eaf-918d-1c7a7dfc22a1';

async function testFilter() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123456',
      }),
    });

    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    console.log('✅ Login successful');

    console.log('\n🎯 Running filter algorithm...');
    const filterResponse = await fetch(
      `${API_URL}/sessions/${SESSION_ID}/run-filter`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const filterData = await filterResponse.json();
    console.log('\n📊 Filter Results:');
    console.log(JSON.stringify(filterData, null, 2));

    // Get applications to see the results
    console.log('\n📋 Fetching applications...');
    const appsResponse = await fetch(
      `${API_URL}/students?sessionId=${SESSION_ID}&page=1&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const appsData = await appsResponse.json();
    console.log('\n👥 Student Applications:');
    appsData.data.forEach((student: any) => {
      console.log(`\n${student.fullName} (${student.idCard}):`);
      student.applications?.forEach((app: any) => {
        console.log(`  NV${app.preferencePriority}: ${app.major?.name} (${app.admissionMethod}) - Score: ${app.calculatedScore?.toFixed(2) || 'N/A'} - Rank: ${app.rankInMajor || 'N/A'} - Status: ${app.admissionStatus}`);
      });
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testFilter();
