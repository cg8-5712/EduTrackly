import os from "os";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function getSystemInfo() {
    // CPU
    const cpus = os.cpus();
    const cpuLoad = cpus.map(cpu => {
        const total = Object.values(cpu.times).reduce((acc, t) => acc + t, 0);
        return {
            model: cpu.model,
            speed: cpu.speed,
            usage: ((total - cpu.times.idle) / total) * 100
        };
    });

    // 内存
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;

    // 磁盘
    let diskUsage = [];
    try {
        const platform = os.platform();
        if (platform === "win32") {
            // Windows 系统
            const { stdout } = await execAsync(
                'wmic logicaldisk get DeviceID,FileSystem,Size,FreeSpace /format:csv'
            );
            diskUsage = stdout
                .split("\n")
                .filter(line => line && !line.startsWith("Node"))
                .map(line => {
                    const parts = line.split(",");
                    return {
                        filesystem: parts[1],
                        fstype: parts[2],
                        size: parts[3] ? parseInt(parts[3], 10) : 0,
                        free: parts[4] ? parseInt(parts[4], 10) : 0,
                        used: parts[3] && parts[4] ? parseInt(parts[3], 10) - parseInt(parts[4], 10) : 0,
                        used_percent:
                            parts[3] && parts[4]
                                ? (((parseInt(parts[3], 10) - parseInt(parts[4], 10)) / parseInt(parts[3], 10)) * 100).toFixed(2)
                                : "0",
                        mount: parts[1]
                    };
                });
        } else {
            // Linux/macOS 系统
            const { stdout } = await execAsync(
                "df -h --output=source,fstype,size,used,avail,pcent,target -x tmpfs -x devtmpfs"
            );
            diskUsage = stdout
                .split("\n")
                .slice(1)
                .filter(Boolean)
                .map(line => {
                    const parts = line.split(/\s+/);
                    return {
                        filesystem: parts[0],
                        fstype: parts[1],
                        size: parts[2],
                        used: parts[3],
                        available: parts[4],
                        used_percent: parts[5],
                        mount: parts[6]
                    };
                });
        }
    } catch (err) {
        diskUsage = { error: err.message };
    }

    // 网络接口
    const networkInterfaces = os.networkInterfaces();
    const networkInfo = Object.entries(networkInterfaces).map(([name, infos]) => ({
        interface: name,
        addresses: infos.map(i => ({
            family: i.family,
            address: i.address,
            mac: i.mac,
            internal: i.internal
        }))
    }));

    return {
        cpu: cpuLoad,
        memory: {
            total: totalMem,
            free: freeMem,
            usage_percent: memUsage.toFixed(2)
        },
        disk: diskUsage,
        network: networkInfo
    };
}
