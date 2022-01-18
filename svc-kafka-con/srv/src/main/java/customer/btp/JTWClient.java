package customer.btp;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.MalformedURLException;
import java.net.Proxy;
import java.net.SocketAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestOperations;
import org.springframework.web.client.RestTemplate;

import com.sap.cloud.security.client.HttpClientFactory;
import com.sap.cloud.security.config.ClientCredentials;
import com.sap.cloud.security.config.Environments;
import com.sap.cloud.security.config.OAuth2ServiceConfiguration;
import com.sap.cloud.security.xsuaa.client.DefaultOAuth2TokenService;
import com.sap.cloud.security.xsuaa.client.XsuaaDefaultEndpoints;
import com.sap.cloud.security.xsuaa.client.XsuaaOAuth2TokenService;
import com.sap.cloud.security.xsuaa.tokenflows.TokenFlowException;
import com.sap.cloud.security.xsuaa.tokenflows.XsuaaTokenFlows;

public class JTWClient {

	private OAuth2ServiceConfiguration config = Environments.getCurrent().getXsuaaConfiguration();
	public JTWClient() {
		// TODO Auto-generated constructor stub
	}
	public void init() throws IllegalArgumentException, URISyntaxException, IOException {
		// if <OAuth2ServiceConfiguration>.getClientIdentity().isCertificateBased() == true
		HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
		requestFactory.setHttpClient(HttpClientFactory.create(config.getClientIdentity()));
		RestOperations restOperations = new RestTemplate(requestFactory);            
	
		XsuaaTokenFlows tokenFlows = new XsuaaTokenFlows(
                new XsuaaOAuth2TokenService(restOperations),
                new XsuaaDefaultEndpoints(config), // XsuaaDefaultEndpoints(url) is deprecated as of 2.10
                config.getClientIdentity());
		// get the URL to xsuaa from the environment variables
//		String url = "https://sa-wpt-dom.authentication.us10.hana.ondemand.com";
//		URI xsuaaUri = new URI(url);		
//		String clientid = "sb-clone603d2253e61f4479aae82ef8f28091e1!b57070|destination-xsappname!b62";
//        String clientsecret =  "9a1218ca-6a5e-4481-a07d-f5efeb8d0148$KABf8psrnlmOE5dADu077sXw0Wlig3FhdcTR9OsyDBE=";
//     // use the XSUAA client library to ease the implementation of the user token exchange flow
//        XsuaaTokenFlows tokenFlows2 = new XsuaaTokenFlows(new DefaultOAuth2TokenService(), new XsuaaDefaultEndpoints(xsuaaUri.toString()), new ClientCredentials(clientid, clientsecret));
//         
//        String jwtToken = tokenFlows.clientCredentialsTokenFlow().execute().getAccessToken();
        

        
		JSONObject jsonObj = new JSONObject(System.getenv("VCAP_SERVICES"));
		JSONArray jsonArr = jsonObj.getJSONArray("connectivity");
		JSONObject connectivityCredentials = jsonArr.getJSONObject(0).getJSONObject("credentials");      
	
		// get value of "onpremise_proxy_host" and "onpremise_proxy_http_port" from the environment variables
		// and create on-premise SOCKS5 proxy
		String connProxyHost = connectivityCredentials.getString("onpremise_proxy_host");
		int connProxyPort = Integer.parseInt(connectivityCredentials.getString("onpremise_socks5_proxy_port"));
		Proxy proxy = new Proxy(Proxy.Type.SOCKS, new InetSocketAddress(connProxyHost, connProxyPort));
		 
		
		 
		// create URL to the remote endpoint you like to call:
		// virtualhost:1234 is defined as an endpoint in the Cloud Connector, as described in the Required Information section
		URL url = new URL("http://virtualkafka:9092");
		SocketAddress socketAddress = new InetSocketAddress(connProxyHost, connProxyPort);
		
		ConnectivitySocks5ProxySocket proxySocket = new ConnectivitySocks5ProxySocket("jwtToken", "sccLocationId");
		
		proxySocket.connect(socketAddress, 30);
		 
		// create the connection object to the endpoint using the proxy
		// this does not open a connection but only creates a connection object, which can be modified later, before actually connecting
		HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection(proxy);		
	}

}
