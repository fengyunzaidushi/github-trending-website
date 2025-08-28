import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

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

// 导入用户信息
async function importUserInfo(userInfoPath) {
  try {
    console.log(`📖 正在读取用户信息文件: ${userInfoPath}`);

    if (!fs.existsSync(userInfoPath)) {
      throw new Error(`文件不存在: ${userInfoPath}`);
    }

    const fileContent = fs.readFileSync(userInfoPath, "utf-8");
    const userInfo = JSON.parse(fileContent);

    console.log(`👤 用户信息: ${userInfo.login} (${userInfo.type})`);

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
      console.error("❌ 用户信息导入失败:", error);
      return false;
    } else {
      console.log("✅ 用户信息导入成功");
      return true;
    }
  } catch (error) {
    console.error("❌ 导入用户信息过程出现错误:", error);
    return false;
  }
}

// 导入用户仓库数据
async function importUserRepositories(repositoriesPath, userLogin) {
  try {
    console.log(`📖 正在读取仓库数据文件: ${repositoriesPath}`);

    if (!fs.existsSync(repositoriesPath)) {
      throw new Error(`文件不存在: ${repositoriesPath}`);
    }

    const fileContent = fs.readFileSync(repositoriesPath, "utf-8");
    const repositories = JSON.parse(fileContent);

    console.log(`📊 找到 ${repositories.length} 个仓库记录`);

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

      console.log(
        `📦 正在处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          repositories.length / batchSize
        )}`
      );

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
            `❌ 批次 ${Math.floor(i / batchSize) + 1} 导入失败:`,
            error
          );
          errorCount += batch.length;
        } else {
          console.log(`✅ 批次 ${Math.floor(i / batchSize) + 1} 导入成功`);
          successCount += batch.length;
        }
      } catch (batchError) {
        console.error(
          `❌ 批次 ${Math.floor(i / batchSize) + 1} 处理失败:`,
          batchError
        );
        errorCount += batch.length;
      }

      // 添加延迟避免API限制
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`\n📈 仓库导入完成统计:`);
    console.log(`✅ 成功: ${successCount} 条记录`);
    console.log(`❌ 失败: ${errorCount} 条记录`);
    console.log(`📊 总计: ${repositories.length} 条记录`);

    return { successCount, errorCount, total: repositories.length };
  } catch (error) {
    console.error("❌ 导入仓库数据过程出现错误:", error);
    return { successCount: 0, errorCount: 0, total: 0 };
  }
}

// 显示统计信息
async function showUserStats(userLogin) {
  try {
    console.log("\n📊 用户数据统计:");

    // 获取用户统计信息
    const { data: userStats, error: statsError } = await supabase.rpc(
      "get_user_stats",
      { target_user_login: userLogin }
    );

    if (statsError) {
      console.error("❌ 获取用户统计失败:", statsError);
      return;
    }

    if (userStats && userStats.length > 0) {
      const stats = userStats[0];
      console.log(`👤 用户: ${stats.user_name} (@${stats.user_login})`);
      console.log(`📊 类型: ${stats.user_type}`);
      console.log(`👥 关注者: ${stats.followers} | 关注: ${stats.following}`);
      console.log(`📦 GitHub公开仓库: ${stats.public_repos}`);
      console.log(`💾 数据库中仓库: ${stats.total_repos_in_db}`);
      console.log(`⭐ 总stars: ${stats.total_stars}`);
      console.log(`📊 平均stars: ${stats.avg_stars}`);
      console.log(`🔤 主要语言: ${stats.top_language || "未知"}`);
      console.log(`🏷️ 使用语言数: ${stats.languages_count}`);
      console.log(
        `📅 账号创建: ${new Date(
          stats.account_created_at
        ).toLocaleDateString()}`
      );
    }

    // 获取语言统计
    const { data: languageStats, error: langError } = await supabase.rpc(
      "get_language_stats_by_user",
      { target_user_login: userLogin }
    );

    if (!langError && languageStats && languageStats.length > 0) {
      console.log("\n🔤 编程语言统计:");
      languageStats.slice(0, 10).forEach((lang, index) => {
        console.log(
          `${index + 1}. ${lang.language}: ${lang.repo_count} 个仓库 (⭐${
            lang.total_stars
          })`
        );
      });
    }
  } catch (error) {
    console.error("❌ 获取统计信息失败:", error);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(
      "使用方法: node import-user-data.mjs <用户信息JSON路径> <仓库数据JSON路径>"
    );
    console.log(
      '例如: node import-user-data.mjs "../data/google-gemini_user_info.json" "../data/google-gemini_repositories.json"'
    );
    process.exit(1);
  }

  const userInfoPath = path.resolve(args[0]);
  const repositoriesPath = path.resolve(args[1]);

  console.log("🚀 开始导入用户数据...");
  console.log(`📁 用户信息文件: ${userInfoPath}`);
  console.log(`📁 仓库数据文件: ${repositoriesPath}`);

  // 1. 导入用户信息
  console.log("\n🔄 步骤1: 导入用户信息");
  const userImported = await importUserInfo(userInfoPath);

  if (!userImported) {
    console.error("❌ 用户信息导入失败，终止操作");
    process.exit(1);
  }

  // 获取用户登录名
  const userInfoContent = fs.readFileSync(userInfoPath, "utf-8");
  const userInfo = JSON.parse(userInfoContent);
  const userLogin = userInfo.login;

  // 2. 导入仓库数据
  console.log("\n🔄 步骤2: 导入仓库数据");
  const repoStats = await importUserRepositories(repositoriesPath, userLogin);

  // 3. 显示统计信息
  console.log("\n🔄 步骤3: 显示统计信息");
  await showUserStats(userLogin);

  console.log("\n🎉 导入完成!");
  console.log(
    `📊 最终统计: 用户信息已导入，仓库 ${repoStats.successCount}/${repoStats.total} 条记录导入成功`
  );
}

main().catch(console.error);
