// src/services/systemService.js
import os from 'os';
import util from 'util';
import { exec } from 'child_process';
const execAsync = util.promisify(exec);

/**
 * 获取系统信息：CPU、Memory、Disk、Network、Load
 */
export async function getSystemInfo() {
    const cpus = calculateCpuUsageAll();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memory = {
        total: totalMem,
        free: freeMem,
        usage_percent: ((1 - freeMem / totalMem) * 100).toFixed(2)
    };

    const load = os.platform() === 'win32' ? null : os.loadavg();

    let disk = [];
    try {
        if (os.platform() === 'win32') {
            disk = await getWindowsDisk();
        } else {
            disk = await getLinuxDisk();
        }
    } catch (e) {
        disk = [{ error: e.message }];
    }

    const networkInterfaces = os.networkInterfaces();
    const network = [];
    for (const [ifaceName, addrs] of Object.entries(networkInterfaces)) {
        network.push({
            interface: ifaceName,
            addresses: addrs.map(addr => ({
                family: addr.family,
                address: addr.address,
                mac: addr.mac,
                internal: addr.internal
            }))
        });
    }

    // 获取操作系统相关信息
    const osInfo = {
        type: os.type(), // 操作系统类型，如 'Linux', 'Darwin', 'Windows_NT'
        platform: os.platform(), // 操作系统平台，如 'linux', 'win32'
        release: os.release(), // 操作系统发布版本
        arch: os.arch(), // 操作系统架构，如 'x64', 'arm64'
        uptime: os.uptime(), // 系统启动以来的时间（单位：秒）
        hostname: os.hostname(), // 主机名
    };

    return { cpu: cpus, memory, load, disk, network, os: osInfo };
}

// ===================== CPU Usage =====================
function calculateCpuUsageAll() {
    const cpus = os.cpus();
    const results = [];
    cpus.forEach(cpu => {
        const { user, nice, sys, idle, irq } = cpu.times;
        const total = user + nice + sys + idle + irq;
        const usage_percent = ((total - idle) / total * 100).toFixed(2);
        results.push({
            model: cpu.model,
            speed: cpu.speed,
            usage_percent
        });
    });
    return results;
}

// ===================== Disk 获取 =====================
async function getWindowsDisk() {
    try {
        const { stdout } = await execAsync(
            'powershell -Command "Get-PSDrive -PSProvider FileSystem | Select-Object Name,Used,Free,Root"'
        );

        const lines = stdout.split(/\r?\n/).filter(line => line.trim() && !line.includes('Name'));
        const disk = lines.map(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 3) return null;
            const [name, usedStr, freeStr] = parts;
            const used = Number(usedStr) || 0;
            const free = Number(freeStr) || 0;
            const size = used + free;
            const used_percent = size > 0 ? Math.round((used / size) * 100) : 0;
            return {
                filesystem: name,
                size,
                used,
                free,
                used_percent,
                mount: name + ':\\'
            };
        }).filter(Boolean);

        return disk;
    } catch (e) {
        return [{ error: e.message }];
    }
}

async function getLinuxDisk() {
    try {
        const { stdout } = await execAsync('df -B1 -x tmpfs -x devtmpfs --output=source,fstype,size,used,avail,pcent,target');
        const lines = stdout.split(/\r?\n/).slice(1).filter(Boolean);
        const disk = lines.map(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 6) return null;
            const [filesystem, fstype, size, used, avail, pcent, mount] = parts;
            const used_percent = parseInt(pcent.replace('%', ''), 10) || 0;
            return { filesystem, fstype, size: Number(size), used: Number(used), free: Number(avail), used_percent, mount };
        }).filter(Boolean);
        return disk;
    } catch (e) {
        return [{ error: e.message }];
    }
}
