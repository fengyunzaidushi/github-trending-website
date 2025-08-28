import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase配置
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://oavfrzhquoxhmbluwgny.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdmZyemhxdW94aG1ibHV3Z255Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI0NTk2NCwiZXhwIjoyMDU5ODIxOTY0fQ.fvKlV0c_gHQ_FqR6A8hjTnuv7VOxldf8rJU1fdJcPTI";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 缺少Supabase环境变量");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 获取所有文件列表并按编号排序
function getOrderedFileList(directory) {
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)_/)?.[1] || "0");
      const numB = parseInt(b.match(/^(\d+)_/)?.[1] || "0");
      return numA - numB;
    });

  return files;
}

// 导入单个用户信息
async function importSingleUser(userInfoPath) {
  try {
    if (!fs.existsSync(userInfoPath)) {
      throw new Error(`文件不存在: ${userInfoPath}`);
    }

    const fileContent = fs.readFileSync(userInfoPath, "utf-8");
    const userInfo = JSON.parse(fileContent);

    // 转换数据格式
    const userData = {
      github_id: userInfo.id,
      login: userInfo.login,
      name: userInfo.name,
      avatar_url: userInfo.avatar_url,
      html_url: userInfo.html_url,
      type: userInfo.type,
      bio: userInfo.bio,
      location: userInfo.location,
      email: userInfo.email,
      company: userInfo.company,
      blog: userInfo.blog,
      public_repos: userInfo.public_repos,
      public_gists: userInfo.public_gists,
      followers: userInfo.followers,
      following: userInfo.following,
      twitter_username: userInfo.twitter_username || null,
      hireable: userInfo.hireable,
      created_at: userInfo.created_at,
      updated_at: userInfo.updated_at,
      last_scraped_at: new Date().toISOString(),
      added_at: new Date().toISOString(),
    };

    // 使用upsert避免重复数据
    const { error } = await supabase.from("users").upsert(userData, {
      onConflict: "github_id",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`❌ 用户 ${userInfo.login} 导入失败:`, error);
      return { success: false, userLogin: userInfo.login, error };
    } else {
      console.log(`✅ 用户 ${userInfo.login} 导入成功`);
      return { success: true, userLogin: userInfo.login, userInfo };
    }
  } catch (error) {
    console.error(`❌ 导入用户信息过程出现错误: ${userInfoPath}`, error);
    return { success: false, userLogin: null, error };
  }
}

// 导入单个用户的仓库数据
async function importSingleUserRepositories(repositoriesPath, userLogin) {
  try {
    if (!fs.existsSync(repositoriesPath)) {
      throw new Error(`文件不存在: ${repositoriesPath}`);
    }

    const fileContent = fs.readFileSync(repositoriesPath, "utf-8");
    const repositories = JSON.parse(fileContent);

    console.log(`📊 用户 ${userLogin}: 找到 ${repositories.length} 个仓库记录`);

    // 获取用户ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("login", userLogin)
      .single();

    if (userError || !userData) {
      throw new Error(`未找到用户: ${userLogin}`);
    }

    const userId = userData.id;

    // 批量导入数据
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < repositories.length; i += batchSize) {
      const batch = repositories.slice(i, i + batchSize);

      try {
        // 转换数据格式
        const dataToInsert = batch.map((repo) => ({
          github_id: repo.id,
          user_id: userId,
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url,
          description: repo.description,
          zh_description: null, // 暂时为空，可以后续翻译
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          size: repo.size,
          stargazers_count: repo.stargazers_count,
          language: repo.language,
          topics: repo.topics || [],
          owner: repo.owner,
          readme_content: null, // 暂时为空，可以后续获取
          added_at: new Date().toISOString(),
        }));

        // 使用upsert避免重复数据
        const { error } = await supabase
          .from("user_repositories")
          .upsert(dataToInsert, {
            onConflict: "github_id",
            ignoreDuplicates: false,
          });

        if (error) {
          console.error(
            `❌ 用户 ${userLogin} 批次 ${
              Math.floor(i / batchSize) + 1
            } 导入失败:`,
            error
          );
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      } catch (batchError) {
        console.error(
          `❌ 用户 ${userLogin} 批次 ${
            Math.floor(i / batchSize) + 1
          } 处理失败:`,
          batchError
        );
        errorCount += batch.length;
      }

      // 添加延迟避免API限制
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `📈 用户 ${userLogin} 仓库导入统计: ✅ 成功 ${successCount} 条, ❌ 失败 ${errorCount} 条`
    );
    return { successCount, errorCount, total: repositories.length };
  } catch (error) {
    console.error(`❌ 用户 ${userLogin} 导入仓库数据过程出现错误:`, error);
    return { successCount: 0, errorCount: 0, total: 0 };
  }
}

// 批量导入所有用户数据
async function batchImportUsers(
  startIndex = 1,
  endIndex = null,
  userInfoDir = null,
  repositoriesDir = null
) {
  // 设置默认路径
  const defaultUserInfoDir = path.resolve(__dirname, "../data/user_info");
  const defaultRepositoriesDir = path.resolve(__dirname, "../data/order");

  const userInfoDirectory = userInfoDir || defaultUserInfoDir;
  const repositoriesDirectory = repositoriesDir || defaultRepositoriesDir;

  console.log("🚀 开始批量导入用户数据...");
  console.log(`📁 用户信息目录: ${userInfoDirectory}`);
  console.log(`📁 仓库数据目录: ${repositoriesDirectory}`);

  // 获取文件列表
  const userInfoFiles = getOrderedFileList(userInfoDirectory);
  const repositoryFiles = getOrderedFileList(repositoriesDirectory);

  console.log(`📊 发现 ${userInfoFiles.length} 个用户信息文件`);
  console.log(`📊 发现 ${repositoryFiles.length} 个仓库数据文件`);

  // 验证文件数量一致
  if (userInfoFiles.length !== repositoryFiles.length) {
    console.error("❌ 用户信息文件和仓库数据文件数量不匹配");
    process.exit(1);
  }

  // 设置结束索引
  const actualEndIndex = endIndex || userInfoFiles.length;
  const actualStartIndex = Math.max(1, startIndex);

  console.log(
    `📋 导入范围: 第 ${actualStartIndex} 到第 ${actualEndIndex} 个文件`
  );

  let totalStats = {
    processedUsers: 0,
    successfulUsers: 0,
    failedUsers: 0,
    totalRepos: 0,
    successfulRepos: 0,
    failedRepos: 0,
  };

  // 开始批量导入
  for (
    let i = actualStartIndex - 1;
    i < Math.min(actualEndIndex, userInfoFiles.length);
    i++
  ) {
    const userInfoFile = userInfoFiles[i];
    const repositoryFile = repositoryFiles[i];

    const userNumber = i + 1;
    console.log(
      `\n🔄 [${userNumber}/${userInfoFiles.length}] 正在处理: ${userInfoFile}`
    );

    // 构建完整路径
    const userInfoPath = path.join(userInfoDirectory, userInfoFile);
    const repositoriesPath = path.join(repositoriesDirectory, repositoryFile);

    // 验证文件对应关系
    const userFileNumber = userInfoFile.match(/^(\d+)_/)?.[1];
    const repoFileNumber = repositoryFile.match(/^(\d+)_/)?.[1];

    if (userFileNumber !== repoFileNumber) {
      console.error(`❌ 文件编号不匹配: ${userInfoFile} vs ${repositoryFile}`);
      totalStats.failedUsers++;
      continue;
    }

    totalStats.processedUsers++;

    // 1. 导入用户信息
    console.log(`  📝 步骤1: 导入用户信息`);
    const userResult = await importSingleUser(userInfoPath);

    if (!userResult.success) {
      console.error(`❌ 用户信息导入失败，跳过仓库导入`);
      totalStats.failedUsers++;
      continue;
    }

    totalStats.successfulUsers++;

    // 2. 导入仓库数据
    console.log(`  📦 步骤2: 导入仓库数据`);
    const repoStats = await importSingleUserRepositories(
      repositoriesPath,
      userResult.userLogin
    );

    totalStats.totalRepos += repoStats.total;
    totalStats.successfulRepos += repoStats.successCount;
    totalStats.failedRepos += repoStats.errorCount;

    console.log(`  ✅ 用户 ${userResult.userLogin} 处理完成`);

    // 添加延迟避免过载
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 显示最终统计
  console.log("\n🎉 批量导入完成!");
  console.log("\n📊 最终统计:");
  console.log(`👥 用户统计:`);
  console.log(`  📋 处理总数: ${totalStats.processedUsers}`);
  console.log(`  ✅ 导入成功: ${totalStats.successfulUsers}`);
  console.log(`  ❌ 导入失败: ${totalStats.failedUsers}`);
  console.log(`📦 仓库统计:`);
  console.log(`  📋 仓库总数: ${totalStats.totalRepos}`);
  console.log(`  ✅ 导入成功: ${totalStats.successfulRepos}`);
  console.log(`  ❌ 导入失败: ${totalStats.failedRepos}`);

  const userSuccessRate =
    totalStats.processedUsers > 0
      ? (
          (totalStats.successfulUsers / totalStats.processedUsers) *
          100
        ).toFixed(2)
      : 0;
  const repoSuccessRate =
    totalStats.totalRepos > 0
      ? ((totalStats.successfulRepos / totalStats.totalRepos) * 100).toFixed(2)
      : 0;

  console.log(`📈 成功率:`);
  console.log(`  👥 用户: ${userSuccessRate}%`);
  console.log(`  📦 仓库: ${repoSuccessRate}%`);

  return totalStats;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  // 解析命令行参数
  let startIndex = 1;
  let endIndex = null;
  let userInfoDir = null;
  let repositoriesDir = null;

  // 简单的参数解析
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--start" && args[i + 1]) {
      startIndex = parseInt(args[i + 1]);
      i++;
    } else if (arg === "--end" && args[i + 1]) {
      endIndex = parseInt(args[i + 1]);
      i++;
    } else if (arg === "--user-dir" && args[i + 1]) {
      userInfoDir = args[i + 1];
      i++;
    } else if (arg === "--repo-dir" && args[i + 1]) {
      repositoriesDir = args[i + 1];
      i++;
    } else if (arg === "--help" || arg === "-h") {
      console.log("用法: node batch-import-users.mjs [选项]");
      console.log("");
      console.log("选项:");
      console.log("  --start <number>     起始文件索引 (默认: 1)");
      console.log("  --end <number>       结束文件索引 (默认: 所有文件)");
      console.log(
        "  --user-dir <path>    用户信息文件目录 (默认: ../data/user_info)"
      );
      console.log(
        "  --repo-dir <path>    仓库数据文件目录 (默认: ../data/order)"
      );
      console.log("  --help, -h          显示此帮助信息");
      console.log("");
      console.log("示例:");
      console.log(
        "  node batch-import-users.mjs --start 2 --end 2   # 只导入第2个文件"
      );
      console.log(
        "  node batch-import-users.mjs --start 1 --end 10  # 导入前10个文件"
      );
      console.log(
        "  node batch-import-users.mjs                     # 导入所有文件"
      );
      process.exit(0);
    }
  }

  console.log("🚀 批量用户数据导入工具");
  console.log(
    `📋 导入设置: 从第 ${startIndex} 个开始${
      endIndex ? `到第 ${endIndex} 个` : "到最后一个"
    }`
  );

  try {
    await batchImportUsers(startIndex, endIndex, userInfoDir, repositoriesDir);
  } catch (error) {
    console.error("❌ 批量导入过程出现错误:", error);
    process.exit(1);
  }
}

main().catch(console.error);
