const axios = require('axios');

async function createDeal() {
  const url = 'https://me.itachyon.com/rest/27/xp77o5948rzldiuh/crm.deal.add.json';

  try {
    const response = await axios.post(url, {
      "fields": {
        "TITLE": "title1",
        "UF_CRM_1683697473619": "ps",
        "UF_CRM_632EC9E45AFBD": "iamgroot",
        "UF_CRM_1683702408727": "ps@gmail.com",
        "UF_CRM_1675089346322": "123",
        "UF_CRM_1675875292996": "jsp",
        "bxu_files[]": ""
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      console.log('Deal created in Bitrix DB', response.status);
      return true;
    } else {
      console.log('Deal not created', response.status);
    }
  } catch (error) {
    console.error('Error from DB:', error);
  }

  return true;
}

createDeal();
