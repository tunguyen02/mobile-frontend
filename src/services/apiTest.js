import axios from 'axios';

// Use the actual URL directly to eliminate any environment variable issues
const testBrandAPI = async () => {
    try {
        console.log('Testing brand API directly...');
        const response = await axios.get('http://localhost:8080/api/brand/get-all');
        console.log('Direct API test response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Direct API test error:', error);
        throw error;
    }
};

export { testBrandAPI }; 