import requests
import os
import json
import time
import re
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from datetime import datetime
from urllib.parse import urljoin, urlparse, parse_qs
import logging
from typing import List, Dict, Optional
import base64

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('github_topics_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()

# 获取所有可用的 GitHub token
available_tokens = []
for i in range(1, 9):  # GITHUB_OAUTH_TOKEN1 到 GITHUB_OAUTH_TOKEN8
    token = os.environ.get(f'GITHUB_OAUTH_TOKEN{i}')
    if token:
        available_tokens.append(token)

if not available_tokens:
    logger.warning("No GitHub tokens found in environment variables")
    current_token = None
else:
    current_token = available_tokens[0]
    logger.info(f"Found {len(available_tokens)} GitHub tokens")

current_token_index = 0

def get_current_headers():
    """获取当前 token 的请求头"""
    if current_token:
        return {"Authorization": f"token {current_token}"}
    return {}

def switch_token():
    """切换到下一个可用的 token"""
    global current_token, current_token_index
    if len(available_tokens) > 1:
        current_token_index = (current_token_index + 1) % len(available_tokens)
        current_token = available_tokens[current_token_index]
        logger.info(f"Switched to token {current_token_index + 1}")
        return True
    return False

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

class GitHubTopicsScraper:
    def __init__(self, topic: str, include_readme: bool = False):
        self.topic = topic
        self.include_readme = include_readme
        self.base_url = f"https://github.com/topics/{topic}"
        self.session = requests.Session()
        self.session.headers.update(headers)
        self.repos = []
        
    def extract_repo_from_element(self, repo_element) -> Optional[Dict]:
        """从HTML元素中提取仓库的 owner 和 name"""
        try:
            # 查找仓库链接 - 寻找指向 /owner/repo 格式的链接
            repo_links = repo_element.find_all('a', href=re.compile(r'^/[^/]+/[^/]+/?$'))
            repo_link = None
            
            for link in repo_links:
                href = link.get('href', '').strip('/')
                # 排除一些非仓库链接
                if not any(x in href.lower() for x in ['login', 'register', 'topics', 'search']):
                    # 检查是否是owner/repo格式
                    parts = href.split('/')
                    if len(parts) == 2 and parts[0] and parts[1]:
                        repo_link = link
                        break
            
            if repo_link:
                full_name = repo_link.get('href', '').strip('/')
                owner, name = full_name.split('/', 1)
                return {
                    'owner': owner,
                    'name': name,
                    'full_name': full_name
                }
            else:
                logger.warning("No valid repo link found in element")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting repo info: {e}")
            return None
    
    def get_repo_api_data(self, owner: str, repo_name: str) -> Optional[Dict]:
        """通过 GitHub API 获取完整的仓库信息"""
        if not current_token:
            logger.warning("No GitHub token provided, cannot fetch API data")
            return None
            
        max_retries = len(available_tokens)
        for attempt in range(max_retries):
            try:
                repo_url = f"https://api.github.com/repos/{owner}/{repo_name}"
                response = requests.get(repo_url, headers=get_current_headers())
                
                if response.status_code == 200:
                    repo_data = response.json()
                    
                    # 提取需要的字段，与 github_repo_total.py 保持一致
                    target_keys = ['id', 'name', 'full_name', 'html_url', 'description', 
                                  'created_at', 'updated_at', 'pushed_at', 'size', 
                                  'stargazers_count', 'language', 'topics']
                    
                    repo_info = {key: repo_data.get(key) for key in target_keys}
                    repo_info['owner'] = owner
                    
                    logger.debug(f"✓ API data fetched for {owner}/{repo_name}")
                    return repo_info
                    
                elif response.status_code == 404:
                    logger.warning(f"Repository {owner}/{repo_name} not found")
                    return None
                elif response.status_code == 403:
                    logger.warning(f"API rate limit hit for {owner}/{repo_name}, switching token...")
                    if not switch_token():
                        logger.error("No more tokens available")
                        return None
                    continue  # 重试
                else:
                    logger.warning(f"Unexpected status {response.status_code} for {owner}/{repo_name}")
                    return None
                    
            except Exception as e:
                logger.error(f"Error getting API data for {owner}/{repo_name}: {e}")
                if attempt < max_retries - 1:
                    switch_token()
                    continue
                return None
                
        return None

    def get_readme_content(self, owner: str, repo_name: str) -> Optional[str]:
        """获取仓库的README文件内容"""
        if not current_token:
            return None
            
        readme_files = [
            'README.md', 'readme.md', 'Readme.md',
            'README', 'readme',
            'README.txt', 'readme.txt',
            'README-zh.md', 'readme-zh.md',
            'README-en.md', 'readme-en.md',
            'README-CN.md', 'readme-cn.md'
        ]
        
        max_retries = len(available_tokens)
        for readme_file in readme_files:
            for attempt in range(max_retries):
                try:
                    readme_url = f"https://api.github.com/repos/{owner}/{repo_name}/contents/{readme_file}"
                    response = requests.get(readme_url, headers=get_current_headers())
                    
                    if response.status_code == 200:
                        readme_data = response.json()
                        content = base64.b64decode(readme_data['content']).decode('utf-8')
                        logger.debug(f"✓ README found for {owner}/{repo_name}: {readme_file}")
                        return content
                    elif response.status_code == 404:
                        break  # 尝试下一个文件名
                    elif response.status_code == 403:
                        logger.warning(f"API rate limit hit, switching token...")
                        if not switch_token():
                            logger.warning(f"No more tokens available, skipping README for {owner}/{repo_name}")
                            return None
                        continue  # 重试当前文件
                    else:
                        logger.warning(f"Unexpected status {response.status_code} for {owner}/{repo_name}/{readme_file}")
                        break  # 尝试下一个文件名
                        
                except Exception as e:
                    logger.error(f"Error getting {readme_file} for {owner}/{repo_name}: {e}")
                    if attempt < max_retries - 1:
                        switch_token()
                        continue
                    break  # 尝试下一个文件名
        
        return None
    
    def scrape_page(self, url: str) -> tuple[List[Dict], Optional[str]]:
        """抓取单个页面的仓库数据"""
        logger.info(f"Scraping: {url}")
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 查找仓库列表容器
            repo_elements = []
            
            # 尝试不同的选择器
            selectors = [
                'article.border',  # 主要的仓库卡片容器
                '.repo-list-item',
                '[data-testid="repo-list-item"]',
                '.Box-row'
            ]
            
            for selector in selectors:
                elements = soup.select(selector)
                if elements:
                    repo_elements = elements
                    logger.info(f"Found {len(elements)} repos using selector: {selector}")
                    break
            
            if not repo_elements:
                # 如果没找到，尝试更通用的方法
                repo_elements = soup.find_all('article') or soup.find_all('div', class_=re.compile(r'repo'))
                logger.info(f"Fallback: found {len(repo_elements)} potential repo elements")
            
            repos_data = []
            for repo_element in repo_elements:
                basic_info = self.extract_repo_from_element(repo_element)
                if basic_info:
                    # 通过 API 获取完整的仓库信息
                    repo_info = self.get_repo_api_data(basic_info['owner'], basic_info['name'])
                    if repo_info:
                        # 获取README内容
                        if self.include_readme:
                            readme_content = self.get_readme_content(repo_info['owner'], repo_info['name'])
                            repo_info['readme'] = readme_content if readme_content else ""
                        else:
                            repo_info['readme'] = ""
                        
                        repos_data.append(repo_info)
                        logger.info(f"✓ Extracted: {repo_info['full_name']} ({repo_info['stargazers_count']} stars)")
                        
                        # API调用后增加延迟
                        time.sleep(0.1)
                    else:
                        logger.warning(f"Failed to get API data for {basic_info['full_name']}")
            
            # 查找"Load more"表单
            next_url = None
            
            # 查找ajax-pagination-form表单
            pagination_form = soup.find('form', class_='ajax-pagination-form')
            if pagination_form:
                # 获取表单的action URL和隐藏的page值
                form_action = pagination_form.get('action', '')
                hidden_page_input = pagination_form.find('input', {'name': 'page', 'type': 'hidden'})
                
                if form_action and hidden_page_input:
                    next_page_value = hidden_page_input.get('value')
                    
                    # 解析当前action URL中的页码参数
                    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
                    parsed = urlparse(form_action)
                    query_params = parse_qs(parsed.query)
                    
                    # 添加新的页码
                    if 'page' not in query_params:
                        query_params['page'] = []
                    query_params['page'].append(next_page_value)
                    
                    # 构造新的URL
                    new_query = urlencode(query_params, doseq=True)
                    next_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
                    
                    logger.info(f"Found pagination form: next page = {next_page_value}")
                    logger.info(f"Next URL: {next_url}")
                    
                    # 安全检查：限制最大页数
                    current_pages = [int(p) for p in query_params.get('page', []) if p.isdigit()]
                    if current_pages and max(current_pages) > 50:
                        next_url = None
                        logger.info("Reached maximum page limit (50)")
                else:
                    logger.warning("Pagination form found but missing action or page input")
            else:
                logger.info("No pagination form found")
            
            return repos_data, next_url
            
        except Exception as e:
            logger.error(f"Error scraping page {url}: {e}")
            return [], None
    
    def scrape_all_pages(self, max_pages: int = None) -> List[Dict]:
        """抓取所有页面的数据"""
        logger.info(f"Starting to scrape GitHub topic: {self.topic}")
        
        current_url = self.base_url
        page_num = 1
        all_repos = []
        
        while current_url and (max_pages is None or page_num <= max_pages):
            logger.info(f"=== Page {page_num} ===")
            
            repos_data, next_url = self.scrape_page(current_url)
            
            if not repos_data:
                logger.warning(f"No repos found on page {page_num}")
                break
            
            all_repos.extend(repos_data)
            logger.info(f"Page {page_num}: {len(repos_data)} repos, Total: {len(all_repos)}")
            
            if not next_url:
                logger.info("No more pages found")
                break
            
            current_url = next_url
            page_num += 1
            
            # 延迟避免被限制
            time.sleep(1)
        
        logger.info(f"Scraping completed. Total repos: {len(all_repos)}")
        return all_repos
    
    def save_results(self, repos: List[Dict], filename: str = None):
        """保存结果到JSON文件"""
        if filename is None:
            date = datetime.now().strftime("%Y-%m-%d")
            time = datetime.now().strftime("%H-%M-%S")
            suffix = "_with_readme" if self.include_readme else ""
            filename = f"./total/{self.topic}_topics{suffix}_{date}_{time}_{len(repos)}.json"
        
        # 确保目录存在
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        # 处理文件名冲突
        base_filename = filename
        index = 0
        while os.path.exists(filename):
            index += 1
            name_parts = base_filename.rsplit('.', 1)
            filename = f"{name_parts[0]}_{index}.{name_parts[1]}"
        
        # 按星数排序
        repos.sort(key=lambda x: x.get('stargazers_count', 0), reverse=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(repos, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Results saved to: {filename}")
        
        # 统计信息
        repos_with_readme = sum(1 for repo in repos if repo.get('readme'))
        logger.info(f"=== 统计信息 ===")
        logger.info(f"总仓库数: {len(repos)}")
        if self.include_readme:
            logger.info(f"有README的仓库: {repos_with_readme}/{len(repos)}")
        
        return filename

def main():
    # 配置参数
    topic = 'memory'  # 可以修改为其他topic
    include_readme = False  # 是否获取README内容
    max_pages = 3  # 限制页数，None表示获取所有页面
    
    scraper = GitHubTopicsScraper(topic, include_readme)
    
    try:
        repos = scraper.scrape_all_pages(max_pages)
        
        if repos:
            filename = scraper.save_results(repos)
            print(f"\n✅ 抓取完成！")
            print(f"📊 总计: {len(repos)} 个仓库")
            print(f"💾 文件: {filename}")
        else:
            print("❌ 没有找到仓库数据")
            
    except KeyboardInterrupt:
        print("\n⏹️ 用户中断")
    except Exception as e:
        logger.error(f"抓取失败: {e}")

if __name__ == "__main__":
    main()