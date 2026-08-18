const http = require('http');
const https = require('https');

const hostname = '127.0.0.1';
const port = 3000;
const instagramUsername = 'n.d.a.m.b.o_ke';

function fetchInstagramProfile() {
  return new Promise((resolve, reject) => {
    const url = `https://www.instagram.com/${instagramUsername}/?__a=1&__d=dis`;
    https.get(url, { headers: { 'user-agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const edges = parsed?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
          const posts = edges
            .map((edge) => edge.node)
            .filter(Boolean)
            .map((node) => {
              const captionText = node?.edge_media_to_caption?.edges?.[0]?.node?.text || 'View this post on Instagram';
              return {
                permalink: `https://www.instagram.com/p/${node.shortcode}/`,
                title: captionText.split('\n')[0].slice(0, 70) || 'Instagram post',
                caption: captionText || 'View this post on Instagram'
              };
            });
          resolve(posts);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/instagram-posts') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const posts = await fetchInstagramProfile();
      res.statusCode = 200;
      res.end(JSON.stringify(posts));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Unable to load Instagram posts' }));
    }
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
});

server.listen(port, hostname, () => {
  console.log(`Instagram proxy server running at http://${hostname}:${port}`);
});
