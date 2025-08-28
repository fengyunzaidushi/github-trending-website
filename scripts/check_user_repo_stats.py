import psycopg2
from dotenv import load_dotenv
import os
import sys
from datetime import datetime

# Load environment variables from .env
load_dotenv('../.env.local')

# 使用与项目一致的数据库连接 - 从SUPABASE_DATABASE_URL解析或使用user/password变量
# 项目使用的是oavfrzhquoxhmbluwgny数据库，我们需要正确的凭据


USER = os.getenv("user2")
PASSWORD = os.getenv("password2")
HOST = os.getenv("host2")
PORT = os.getenv("port2")
DBNAME = os.getenv("dbname2")

def check_user_repo_stats():
    """
    检查user_repositories表中每个用户的仓库数量统计
    """
    
    print(f"📊 User Repository Statistics Check")
    print("="*50)
    
    try:
        # Connect to the database
        connection = psycopg2.connect(
            user=USER,
            password=PASSWORD,
            host=HOST,
            port=PORT,
            dbname=DBNAME
        )
        print(f"\n✅ Database connection successful!")
        print(f"🔗 Connected to: {DBNAME} at {HOST}:{PORT}")
        
        cursor = connection.cursor()
        
        # 执行与数据库函数相同的完整统计查询
        query = """
        WITH user_repo_stats AS (
            SELECT 
                ur.user_id,
                COUNT(*) as total_repos_in_db,
                SUM(ur.stargazers_count) as total_stars,
                AVG(ur.stargazers_count) as avg_stars,
                MAX(ur.updated_at) as last_repo_update
            FROM user_repositories ur
            WHERE ur.user_id IS NOT NULL
            GROUP BY ur.user_id
        ),
        user_language_stats AS (
            SELECT 
                ur.user_id,
                ur.language,
                COUNT(*) as lang_count,
                ROW_NUMBER() OVER (PARTITION BY ur.user_id ORDER BY COUNT(*) DESC) as rn
            FROM user_repositories ur
            WHERE ur.user_id IS NOT NULL AND ur.language IS NOT NULL AND ur.language != ''
            GROUP BY ur.user_id, ur.language
        ),
        user_top_language AS (
            SELECT user_id, language as top_language
            FROM user_language_stats
            WHERE rn = 1
        ),
        user_languages_count AS (
            SELECT 
                user_id,
                COUNT(DISTINCT language) as languages_count
            FROM user_repositories
            WHERE user_id IS NOT NULL AND language IS NOT NULL AND language != ''
            GROUP BY user_id
        )
        SELECT 
            u.id,
            u.login as user_login,
            u.name as user_name,
            u.type as user_type,
            u.followers,
            u.following,
            u.public_repos,
            COALESCE(urs.total_repos_in_db, 0) as total_repos_in_db,
            COALESCE(urs.total_stars, 0) as total_stars,
            ROUND(COALESCE(urs.avg_stars, 0), 2) as avg_stars,
            utl.top_language,
            COALESCE(ulc.languages_count, 0) as languages_count,
            urs.last_repo_update,
            u.created_at as account_created_at
        FROM users u
        LEFT JOIN user_repo_stats urs ON u.id = urs.user_id
        LEFT JOIN user_top_language utl ON u.id = utl.user_id
        LEFT JOIN user_languages_count ulc ON u.id = ulc.user_id
        ORDER BY COALESCE(urs.total_stars, 0) DESC;
        """
        
        print(f"\n🔍 Executing full user stats query (similar to get_user_stats function):")
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        if not results:
            print("\n📭 No results found")
            return
        
        print(f"\n📋 Results (Top 10):")
        print(f"{'Login':<20} {'Name':<25} {'Type':<15} {'Repos':<8} {'Stars':<10}")
        print("-" * 88)
        
        for i, row in enumerate(results[:10]):
            user_id, login, name, user_type, followers, following, public_repos, total_repos_in_db, total_stars, avg_stars, top_language, languages_count, last_repo_update, account_created_at = row
            name_display = (name or '')[:24] if name else ''
            print(f"{login:<20} {name_display:<25} {user_type:<15} {total_repos_in_db:<8} {total_stars:<10}")
        
        # 统计有仓库数据的用户
        users_with_repos = sum(1 for row in results if row[7] > 0)  # total_repos_in_db > 0
        users_without_repos = len(results) - users_with_repos
        total_repos = sum(row[7] for row in results)
        total_stars = sum(row[8] for row in results)
        
        print(f"\n📊 Complete Statistics:")
        print(f"Total users returned by query: {len(results)}")
        print(f"Users with repositories: {users_with_repos}")
        print(f"Users without repositories: {users_without_repos}")
        print(f"Total repositories: {total_repos}")
        print(f"Total stars: {total_stars}")
        if users_with_repos > 0:
            print(f"Average repos per user (with repos): {total_repos/users_with_repos:.2f}")
            print(f"Average stars per user (with repos): {total_stars/users_with_repos:.2f}")
        
        # 还要检查总用户数
        print(f"\n🔍 Additional checks:")
        
        # 检查users表总数
        cursor.execute("SELECT COUNT(*) FROM users;")
        total_users = cursor.fetchone()[0]
        print(f"Total users in users table: {total_users}")
        
        # 检查user_repositories表总数
        cursor.execute("SELECT COUNT(*) FROM user_repositories;")
        total_repo_records = cursor.fetchone()[0]
        print(f"Total records in user_repositories table: {total_repo_records}")
        
        # 检查有多少unique owners
        cursor.execute("SELECT COUNT(DISTINCT owner) FROM user_repositories WHERE owner IS NOT NULL;")
        unique_owners = cursor.fetchone()[0]
        print(f"Unique owners in user_repositories: {unique_owners}")
        
        # 检查user_id为NULL的记录数
        cursor.execute("SELECT COUNT(*) FROM user_repositories WHERE user_id IS NULL;")
        null_user_id_count = cursor.fetchone()[0]
        print(f"Records with NULL user_id: {null_user_id_count}")
        
        print(f"\n🕒 Check completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
        
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()
            print("🔌 Database connection closed.")

def main():
    """Main function to run the user repository statistics check"""
    
    if not all([USER, PASSWORD, HOST, PORT, DBNAME]):
        print("❌ Error: Missing database connection parameters in .env.local file")
        print("Required variables: SUPABASE_DATABASE_URL or user, password, host, port, dbname")
        sys.exit(1)
    
    check_user_repo_stats()

if __name__ == "__main__":
    main()