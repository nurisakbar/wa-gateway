# 🚢 Deploy Scripts

Script untuk automated deployment aplikasi ke server production.

## 📋 Script yang Tersedia

### `deploy.sh`
Automated deployment script yang melakukan:
- Setup repository
- Create environment files
- Configure Nginx
- Deploy dengan Docker
- Setup SSL dengan Let's Encrypt
- Run database migrations
- Verify deployment

**Usage:**
```bash
./devops/deploy/deploy.sh
```

**Prerequisites:**
- User `wagateway` sudah dibuat
- Docker dan Docker Compose terinstall
- Nginx terinstall
- Certbot terinstall (untuk SSL)

### `setup-ubuntu-server.sh`
Script untuk setup awal server Ubuntu:
- Install dependencies (Docker, Nginx, Node.js, dll)
- Create user `wagateway`
- Setup firewall
- Configure system

**Usage:**
```bash
sudo ./devops/deploy/setup-ubuntu-server.sh
```

**Prerequisites:**
- Ubuntu Server 20.04+
- Root access atau sudo

## 📝 Deployment Flow

1. **Setup Server** (run sekali di awal):
   ```bash
   sudo ./devops/deploy/setup-ubuntu-server.sh
   ```

2. **Deploy Application**:
   ```bash
   # Login sebagai user wagateway
   su - wagateway
   
   # Run deploy script
   ./devops/deploy/deploy.sh
   ```

3. **Verify Deployment**:
   - Check status: `docker compose ps`
   - Check logs: `docker compose logs -f`
   - Test URL: `https://your-domain.com`

## 🔧 Post-Deployment

Setelah deployment, informasi disimpan di `deployment-info.txt`:
- Domain configuration
- Database credentials
- Useful commands
- Backup procedures

## 🔄 Update Application

Untuk update aplikasi setelah deployment:

```bash
cd wa-gateway
git pull
docker compose up -d --build
```

## 🆘 Troubleshooting

**Deployment failed:**
- Check logs: `docker compose logs`
- Verify environment files
- Check database connection

**SSL certificate issues:**
- Verify domain DNS pointing
- Check firewall rules
- Verify Nginx configuration

**Database migration errors:**
- Check database connection
- Verify credentials in `.env`
- Manually run migrations if needed

